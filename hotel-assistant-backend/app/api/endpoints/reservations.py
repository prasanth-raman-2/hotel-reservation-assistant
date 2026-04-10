import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pymongo.database import Database

from app.core.database import get_db
from app.core.settings import settings
from app.schemas.reservation import ReservationCreate, ReservationResponse, ReservationMasked
from app.services.reservation_service import (
    create_reservation,
    get_reservation,
    cancel_reservation,
)

from app.services.reservation_service import get_all_reservations

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reservations", tags=["Reservations"])


@router.get("/", response_model=list[ReservationResponse])
async def list_all(db: Database = Depends(get_db)):
    """List all reservations (super user view)."""
    reservations = get_all_reservations(db)
    return [
        ReservationResponse(
            id=r["_id"],
            guest_name=r["guest_name"],
            guest_email=r["guest_email"],
            room_type=r["room_type"],
            check_in=r["check_in"],
            check_out=r["check_out"],
            num_guests=r["num_guests"],
            status=r["status"],
            special_requests=r.get("special_requests"),
            created_at=r.get("created_at"),
        )
        for r in reservations
    ]


@router.post("/", response_model=ReservationResponse)
async def create(data: ReservationCreate, db: Database = Depends(get_db)):
    reservation = create_reservation(db, data.model_dump())
    return ReservationResponse(
        id=reservation["_id"],
        guest_name=reservation["guest_name"],
        guest_email=reservation["guest_email"],
        room_type=reservation["room_type"],
        check_in=reservation["check_in"],
        check_out=reservation["check_out"],
        num_guests=reservation["num_guests"],
        status=reservation["status"],
        special_requests=reservation.get("special_requests"),
        created_at=reservation.get("created_at"),
    )


@router.get("/{reservation_id}", response_model=ReservationResponse)
async def view(reservation_id: str, db: Database = Depends(get_db)):
    reservation = get_reservation(db, reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return ReservationResponse(
        id=reservation["_id"],
        guest_name=reservation["guest_name"],
        guest_email=reservation["guest_email"],
        room_type=reservation["room_type"],
        check_in=reservation["check_in"],
        check_out=reservation["check_out"],
        num_guests=reservation["num_guests"],
        status=reservation["status"],
        special_requests=reservation.get("special_requests"),
        created_at=reservation.get("created_at"),
    )


@router.delete("/{reservation_id}", response_model=ReservationMasked)
async def cancel(reservation_id: str, db: Database = Depends(get_db)):
    reservation = cancel_reservation(db, reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return ReservationMasked(
        id=reservation["_id"],
        room_type=reservation["room_type"],
        check_in=reservation["check_in"],
        check_out=reservation["check_out"],
        status=reservation["status"],
    )


@router.post("/upload-pdf")
async def upload_hotel_pdf(file: UploadFile = File(...)):
    """Upload or replace the hotel information PDF and rebuild the RAG index."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    pdf_path = settings.HOTEL_PDF_PATH
    with open(pdf_path, "wb") as f:
        f.write(content)

    from app.rag.retriever import get_collection, build_index

    collection = get_collection()
    existing_ids = collection.get()["ids"]
    if existing_ids:
        collection.delete(ids=existing_ids)

    count = build_index()
    return {"message": f"PDF uploaded and indexed. {count} chunks created."}
