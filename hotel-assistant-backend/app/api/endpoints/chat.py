import logging

from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.core.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse, SessionOut, SessionDetailOut, MessageOut
from app.services.agent_service import chat
from app.services.guardrails import check_guardrails

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: Database = Depends(get_db)):
    blocked = check_guardrails(request.message)
    if blocked:
        return ChatResponse(
            reply=blocked,
            session_id=request.session_id or "",
            tool_used="guardrail",
        )

    reply, session_id, tool_used = chat(request.message, request.session_id, db)
    return ChatResponse(reply=reply, session_id=session_id, tool_used=tool_used)


@router.get("/sessions", response_model=list[SessionOut])
async def list_sessions(db: Database = Depends(get_db)):
    """List all chat sessions, most recent first."""
    sessions = list(
        db["chat_sessions"]
        .find()
        .sort("updated_at", -1)
        .limit(50)
    )
    return [
        SessionOut(
            id=s["_id"],
            title=s.get("title", "Untitled"),
            created_at=s.get("created_at"),
            updated_at=s.get("updated_at"),
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=SessionDetailOut)
async def get_session(session_id: str, db: Database = Depends(get_db)):
    """Get a chat session with all its messages."""
    session = db["chat_sessions"].find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = list(
        db["chat_messages"]
        .find({"session_id": session_id})
        .sort("created_at", 1)
    )

    return SessionDetailOut(
        id=session["_id"],
        title=session.get("title", "Untitled"),
        messages=[
            MessageOut(
                id=m["_id"],
                role=m["role"],
                content=m["content"],
                tool_used=m.get("tool_used"),
                created_at=m.get("created_at"),
            )
            for m in messages
        ],
        created_at=session.get("created_at"),
    )


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: Database = Depends(get_db)):
    """Delete a chat session and its messages."""
    session = db["chat_sessions"].find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db["chat_messages"].delete_many({"session_id": session_id})
    db["chat_sessions"].delete_one({"_id": session_id})
    return {"status": "deleted"}
