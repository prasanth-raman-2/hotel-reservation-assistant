from datetime import date, datetime
from pydantic import BaseModel


class ReservationCreate(BaseModel):
    guest_name: str
    guest_email: str
    room_type: str = "standard"
    check_in: str
    check_out: str
    num_guests: int = 1
    special_requests: str | None = None


class ReservationResponse(BaseModel):
    id: str
    guest_name: str
    guest_email: str
    room_type: str
    check_in: str
    check_out: str
    num_guests: int
    status: str
    special_requests: str | None = None
    created_at: datetime | None = None


class ReservationMasked(BaseModel):
    """Response with PII masked for non-owner access."""
    id: str
    room_type: str
    check_in: str
    check_out: str
    status: str
