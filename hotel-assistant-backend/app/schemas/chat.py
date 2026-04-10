from datetime import datetime
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    tool_used: str | None = None


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    tool_used: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class SessionDetailOut(BaseModel):
    id: str
    title: str
    messages: list[MessageOut]
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
