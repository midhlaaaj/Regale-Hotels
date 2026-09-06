from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import GuestClaims, get_current_guest
from app.db import get_session
from app.models import Booking, Guest
from app.schemas.public import BookingCancelIn, BookingCreate, BookingOut, ConfirmPaymentIn
from app.services.booking import cancel_own_booking, confirm_stub_payment, create_booking

_email_adapter = TypeAdapter(EmailStr)

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _to_out(booking: Booking) -> BookingOut:
    return BookingOut(
        id=booking.id,
        status=booking.status,
        source=booking.source,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guests_count=booking.guests_count,
        total_amount=float(booking.total_amount),
        property_id=booking.property_id,
        room_type_id=booking.room_type_id,
    )


@router.post("", response_model=BookingOut)
async def post_booking(payload: BookingCreate, session: AsyncSession = Depends(get_session)):
    booking = await create_booking(session, payload)
    return _to_out(booking)


@router.get("/me", response_model=list[BookingOut])
async def list_my_bookings(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    guest: GuestClaims = Depends(get_current_guest),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Booking)
        .where(Booking.guest_id == guest.guest_id)
        .order_by(Booking.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return [_to_out(b) for b in result.scalars().all()]


@router.post("/{booking_id}/confirm-stub", response_model=BookingOut)
async def post_confirm_stub(
    booking_id: int,
    payload: ConfirmPaymentIn,
    session: AsyncSession = Depends(get_session),
):
    """Temporary stand-in for the Razorpay webhook. Flips pending_payment -> confirmed.
    Replace with real webhook signature verification when Razorpay sandbox keys are wired up.
    Gated by payments_stub_mode so a deploy can't accidentally fake a payment once a
    real gateway is configured — flip that setting to False when wiring in Razorpay."""
    if not settings.payments_stub_mode:
        raise HTTPException(501, "Payment confirmation is not implemented")
    booking = await confirm_stub_payment(session, booking_id, payload.email)
    return _to_out(booking)


@router.patch("/{booking_id}/cancel", response_model=BookingOut)
async def post_cancel_booking(
    booking_id: int,
    payload: BookingCancelIn,
    session: AsyncSession = Depends(get_session),
):
    booking = await cancel_own_booking(session, booking_id, payload.email)
    return _to_out(booking)


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: int,
    email: str = Query(..., max_length=254),
    session: AsyncSession = Depends(get_session),
):
    try:
        clean_email = _email_adapter.validate_python(email)
    except ValidationError as exc:
        raise HTTPException(422, "Invalid email format") from exc

    booking = await session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")
    guest = await session.get(Guest, booking.guest_id) if booking.guest_id else None
    if not guest or guest.email.lower() != clean_email.lower():
        raise HTTPException(404, "Booking not found")
    return _to_out(booking)
