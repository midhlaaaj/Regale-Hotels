from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import AdminClaims, get_current_admin, scope_property_id
from app.db import get_session
from app.models import Booking, BookingStatus
from app.schemas.admin_content import AdminBookingCreate
from app.services.booking import create_manual_booking

router = APIRouter(prefix="/api/admin/bookings", tags=["admin-bookings"])


@router.post("")
async def post_manual_booking(
    payload: AdminBookingCreate,
    admin: AdminClaims = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    """Logs a walk-in/phone reservation taken outside the site — payment is
    handled by staff directly, so this creates the booking already confirmed."""
    property_id = scope_property_id(payload.property_id, admin)
    return await create_manual_booking(session, property_id, payload)


@router.get("")
async def list_bookings(
    property: int | None = None,
    status: BookingStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    admin: AdminClaims = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    scoped_property = scope_property_id(property, admin)
    query = select(Booking)
    if scoped_property is not None:
        query = query.where(Booking.property_id == scoped_property)
    if status is not None:
        query = query.where(Booking.status == status)
    if date_from is not None:
        query = query.where(Booking.check_in >= date_from)
    if date_to is not None:
        query = query.where(Booking.check_out <= date_to)
    result = await session.execute(query.order_by(Booking.created_at.desc()).limit(limit).offset(offset))
    return result.scalars().all()


async def _get_scoped_booking(session: AsyncSession, admin: AdminClaims, booking_id: int) -> Booking:
    booking = await session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")
    scoped = scope_property_id(booking.property_id, admin)
    if scoped != booking.property_id:
        raise HTTPException(404, "Booking not found")
    return booking


@router.patch("/{booking_id}/confirm")
async def confirm_booking(
    booking_id: int,
    admin: AdminClaims = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    booking = await _get_scoped_booking(session, admin, booking_id)
    if booking.status != BookingStatus.pending_whatsapp:
        raise HTTPException(400, "Only pending WhatsApp bookings can be confirmed this way")
    booking.status = BookingStatus.confirmed
    booking.updated_at = datetime.utcnow()
    session.add(booking)
    await session.commit()
    await session.refresh(booking)
    return booking


@router.patch("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    admin: AdminClaims = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    booking = await _get_scoped_booking(session, admin, booking_id)
    booking.status = BookingStatus.cancelled
    booking.updated_at = datetime.utcnow()
    session.add(booking)
    await session.commit()
    await session.refresh(booking)
    return booking


@router.post("/{booking_id}/refund")
async def refund_booking(
    booking_id: int,
    admin: AdminClaims = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    """Stub — flips status to refunded. Replace with a real Razorpay refund call
    once sandbox keys are wired up; payments.status must then only change via that call.
    Gated by payments_stub_mode so this can't fake a refund once a real gateway is live."""
    if not settings.payments_stub_mode:
        raise HTTPException(501, "Refund is not implemented")
    booking = await _get_scoped_booking(session, admin, booking_id)
    if booking.status != BookingStatus.confirmed:
        raise HTTPException(400, "Only confirmed bookings can be refunded")
    booking.status = BookingStatus.refunded
    booking.updated_at = datetime.utcnow()
    session.add(booking)
    await session.commit()
    await session.refresh(booking)
    return booking
