import json
import logging
import uuid
from datetime import datetime, date

from pymongo.database import Database
from litellm import completion

from app.core.settings import settings
from app.rag.retriever import retrieve
from app.services.reservation_service import (
    create_reservation,
    get_reservation,
    cancel_reservation,
    get_reservations_by_email,
)
from app.prompts.system_prompt import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# In-memory LLM conversation history (includes tool messages MongoDB doesn't store)
_llm_histories: dict[str, list[dict]] = {}

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_hotel_info",
            "description": "Search the hotel document for information about the hotel. Use this for any question about hotel facilities, policies, food, hygiene, location, check-in/check-out times, amenities, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to find relevant information in the hotel document",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_reservation",
            "description": "Create a new hotel room reservation. Requires all guest details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_name": {"type": "string", "description": "Full name of the guest"},
                    "guest_email": {"type": "string", "description": "Email address of the guest"},
                    "room_type": {
                        "type": "string",
                        "enum": ["standard", "deluxe", "suite"],
                        "description": "Type of room",
                    },
                    "check_in": {"type": "string", "description": "Check-in date (YYYY-MM-DD)"},
                    "check_out": {"type": "string", "description": "Check-out date (YYYY-MM-DD)"},
                    "num_guests": {"type": "integer", "description": "Number of guests", "default": 1},
                    "special_requests": {
                        "type": "string",
                        "description": "Any special requests from the guest",
                    },
                },
                "required": ["guest_name", "guest_email", "room_type", "check_in", "check_out"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "view_reservation",
            "description": "View an existing reservation by its ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reservation_id": {
                        "type": "string",
                        "description": "The unique reservation ID",
                    }
                },
                "required": ["reservation_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_my_reservations",
            "description": "List all active reservations for a guest by their email address. Use this when the user wants to see their bookings or reservation history.",
            "parameters": {
                "type": "object",
                "properties": {
                    "guest_email": {
                        "type": "string",
                        "description": "The email address of the guest whose reservations to look up",
                    }
                },
                "required": ["guest_email"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_reservation",
            "description": "Cancel an existing reservation by its ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reservation_id": {
                        "type": "string",
                        "description": "The unique reservation ID to cancel",
                    }
                },
                "required": ["reservation_id"],
            },
        },
    },
]


def _execute_tool(tool_name: str, args: dict, db: Database) -> str:
    """Execute a tool call and return the result as a string."""
    if tool_name == "search_hotel_info":
        chunks = retrieve(args["query"])
        if not chunks:
            return "No relevant information found in the hotel document."
        context = "\n\n---\n\n".join(chunks)
        return f"Relevant hotel information:\n\n{context}"

    elif tool_name == "create_reservation":
        try:
            reservation = create_reservation(db, {
                "guest_name": args["guest_name"],
                "guest_email": args["guest_email"],
                "room_type": args.get("room_type", "standard"),
                "check_in": args["check_in"],
                "check_out": args["check_out"],
                "num_guests": args.get("num_guests", 1),
                "special_requests": args.get("special_requests"),
            })
            return json.dumps({
                "status": "success",
                "reservation_id": reservation["_id"],
                "guest_name": reservation["guest_name"],
                "room_type": reservation["room_type"],
                "check_in": str(reservation["check_in"]),
                "check_out": str(reservation["check_out"]),
                "num_guests": reservation["num_guests"],
                "status_text": reservation["status"],
            })
        except Exception as e:
            return f"Failed to create reservation: {str(e)}"

    elif tool_name == "view_reservation":
        reservation = get_reservation(db, args["reservation_id"])
        if not reservation:
            return "No active reservation found with that ID."
        return json.dumps({
            "reservation_id": reservation["_id"],
            "guest_name": reservation["guest_name"],
            "room_type": reservation["room_type"],
            "check_in": str(reservation["check_in"]),
            "check_out": str(reservation["check_out"]),
            "num_guests": reservation["num_guests"],
            "status": reservation["status"],
            "special_requests": reservation.get("special_requests"),
        })

    elif tool_name == "list_my_reservations":
        reservations = get_reservations_by_email(db, args["guest_email"])
        if not reservations:
            return "No active reservations found for this email."
        result = []
        for r in reservations:
            result.append({
                "reservation_id": r["_id"],
                "guest_name": r["guest_name"],
                "room_type": r["room_type"],
                "check_in": str(r["check_in"]),
                "check_out": str(r["check_out"]),
                "num_guests": r["num_guests"],
                "status": r["status"],
                "special_requests": r.get("special_requests"),
            })
        return json.dumps({"reservations": result, "count": len(result)})

    elif tool_name == "cancel_reservation":
        reservation = cancel_reservation(db, args["reservation_id"])
        if not reservation:
            return "No reservation found with that ID."
        return json.dumps({
            "status": "success",
            "reservation_id": reservation["_id"],
            "new_status": reservation["status"],
        })

    return f"Unknown tool: {tool_name}"


def _generate_session_title(message: str) -> str:
    title = message.strip()[:60]
    if len(message.strip()) > 60:
        title += "..."
    return title


def _load_history_from_db(session_id: str, db: Database) -> list[dict]:
    """Rebuild LLM conversation history from persisted messages."""
    history = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages = list(
        db["chat_messages"]
        .find({"session_id": session_id})
        .sort("created_at", 1)
    )
    for msg in messages:
        history.append({"role": msg["role"], "content": msg["content"]})
    return history


def chat(message: str, session_id: str | None, db: Database) -> tuple[str, str, str | None]:
    """
    Process a chat message through the agent.
    Returns (reply, session_id, tool_used).
    """
    is_new_session = False
    now = datetime.utcnow()

    # Create or get session
    if not session_id:
        session_id = str(uuid.uuid4())
        is_new_session = True
        db["chat_sessions"].insert_one({
            "_id": session_id,
            "title": _generate_session_title(message),
            "created_at": now,
            "updated_at": now,
        })
    else:
        existing = db["chat_sessions"].find_one({"_id": session_id})
        if not existing:
            is_new_session = True
            db["chat_sessions"].insert_one({
                "_id": session_id,
                "title": _generate_session_title(message),
                "created_at": now,
                "updated_at": now,
            })

    # Get or rebuild LLM history
    if session_id not in _llm_histories:
        _llm_histories[session_id] = _load_history_from_db(session_id, db)

    history = _llm_histories[session_id]
    history.append({"role": "user", "content": message})

    # Persist user message
    db["chat_messages"].insert_one({
        "_id": str(uuid.uuid4()),
        "session_id": session_id,
        "role": "user",
        "content": message,
        "tool_used": None,
        "created_at": now,
    })

    tool_used = None
    max_iterations = 5
    reply = ""

    for _ in range(max_iterations):
        response = completion(
            model=settings.LLM_MODEL,
            messages=history,
            tools=TOOLS,
            tool_choice="auto",
        )

        assistant_message = response.choices[0].message

        if not assistant_message.tool_calls:
            reply = assistant_message.content or ""
            history.append({"role": "assistant", "content": reply})
            break
        else:
            history.append(assistant_message.model_dump())

            for tool_call in assistant_message.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)
                tool_used = fn_name

                logger.info("Tool call: %s", fn_name)
                result = _execute_tool(fn_name, fn_args, db)

                history.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result,
                })
    else:
        reply = "I encountered an issue processing your request. Please try again."
        history.append({"role": "assistant", "content": reply})

    # Persist assistant message
    db["chat_messages"].insert_one({
        "_id": str(uuid.uuid4()),
        "session_id": session_id,
        "role": "assistant",
        "content": reply,
        "tool_used": tool_used,
        "created_at": datetime.utcnow(),
    })

    # Update session timestamp
    db["chat_sessions"].update_one(
        {"_id": session_id},
        {"$set": {"updated_at": datetime.utcnow()}},
    )

    # Trim in-memory history
    if len(history) > 31:
        _llm_histories[session_id] = [history[0]] + history[-30:]

    return reply, session_id, tool_used
