import logging

from pymongo import MongoClient
from pymongo.database import Database

from app.core.settings import settings

logger = logging.getLogger(__name__)

_client: MongoClient | None = None
_db: Database | None = None


def connect_db() -> Database:
    global _client, _db
    if _db is not None:
        return _db

    logger.info("Connecting to MongoDB at %s", settings.MONGO_URI.split("@")[-1])
    _client = MongoClient(settings.MONGO_URI)
    _db = _client[settings.MONGO_DB_NAME]

    # Test connection
    _client.admin.command("ping")
    logger.info("MongoDB connected. Database: %s", settings.MONGO_DB_NAME)

    # Create indexes
    _db["reservations"].create_index("guest_email")
    _db["reservations"].create_index("status")
    _db["chat_sessions"].create_index("updated_at")

    return _db


def get_db() -> Database:
    if _db is None:
        return connect_db()
    return _db
