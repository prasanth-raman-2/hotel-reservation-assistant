import logging
import uuid
from datetime import datetime

from pymongo.database import Database

logger = logging.getLogger(__name__)


def create_reservation(db: Database, data: dict) -> dict:
    reservation = {
        "_id": str(uuid.uuid4()),
        "guest_name": data["guest_name"],
        "guest_email": data["guest_email"],
        "room_type": data.get("room_type", "standard"),
        "check_in": data["check_in"],
        "check_out": data["check_out"],
        "num_guests": data.get("num_guests", 1),
        "special_requests": data.get("special_requests"),
        "status": "confirmed",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    db["reservations"].insert_one(reservation)
    logger.info("Reservation created: %s (PII redacted in logs)", reservation["_id"])
    return reservation


def get_reservation(db: Database, reservation_id: str) -> dict | None:
    return db["reservations"].find_one(
        {"_id": reservation_id, "status": {"$ne": "cancelled"}}
    )


def cancel_reservation(db: Database, reservation_id: str) -> dict | None:
    result = db["reservations"].find_one_and_update(
        {"_id": reservation_id},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}},
        return_document=True,
    )
    if result:
        logger.info("Reservation cancelled: %s", reservation_id)
    return result


def get_reservations_by_email(db: Database, email: str) -> list[dict]:
    return list(
        db["reservations"].find(
            {"guest_email": email, "status": {"$ne": "cancelled"}}
        )
    )


def get_all_reservations(db: Database) -> list[dict]:
    """Get all reservations, most recent first (super user)."""
    return list(
        db["reservations"].find().sort("created_at", -1).limit(100)
    )
