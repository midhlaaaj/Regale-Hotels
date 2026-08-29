from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import (
    Availability,
    Booking,
    BookingSource,
    BookingStatus,
    Guest,
    Payment,
    PaymentGateway,
    PaymentStatus,
    Property,
    RatePlan,
    RoomType,
)
from app.schemas.public import BookingCreate

# Statuses that count as "holding" a room for a given night.
HOLDING_STATUSES = (BookingStatus.confirmed, BookingStatus.pending_payment)
MAX_STAY_NIGHTS = 30
MAX_ADVANCE_BOOKING_DAYS = 730  # 2 years — keeps the availability loop bounded


def _nights(check_in, check_out) -> list:
    return [check_in + timedelta(days=i) for i in range((check_out - check_in).days)]


async def _held_count(session: AsyncSession, room_type_id: int, day) -> int:
    expiry_cutoff = datetime.utcnow() - timedelta(minutes=settings.pending_payment_expiry_minutes)
    result = await session.execute(
        select(func.count(Booking.id)).where(
            Booking.room_type_id == room_type_id,
            Booking.check_in <= day,
            Booking.check_out > day,
            and_(
                Booking.status.in_(HOLDING_STATUSES),
                # an expired pending_payment hold no longer counts
                ~and_(
                    Booking.status == BookingStatus.pending_payment,
                    Booking.created_at < expiry_cutoff,
                ),
            ),
        )
    )
    return result.scalar_one()


async def create_booking(session: AsyncSession, payload: BookingCreate) -> Booking:
    if payload.check_in >= payload.check_out:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "check_out must be after check_in")
    if payload.check_in < datetime.utcnow().date():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "check_in cannot be in the past")
    if (payload.check_out - payload.check_in).days > MAX_STAY_NIGHTS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Stays longer than {MAX_STAY_NIGHTS} nights aren't supported")
    if (payload.check_in - datetime.utcnow().date()).days > MAX_ADVANCE_BOOKING_DAYS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Check-in date is too far in the future")

    room_type = await session.get(RoomType, payload.room_type_id)
    rate_plan = await session.get(RatePlan, payload.rate_plan_id)
    property_ = await session.get(Property, payload.property_id)
    if not room_type or not rate_plan or not property_:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Property, room type, or rate plan not found")
    if rate_plan.room_type_id != room_type.id or room_type.property_id != property_.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Room/rate plan does not belong to this property")

    if payload.guests_count > room_type.max_occupancy:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Guest count exceeds room's max occupancy")
    if not (rate_plan.valid_from <= payload.check_in and payload.check_out <= rate_plan.valid_to):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Dates fall outside this rate plan's validity window")

    nights = _nights(payload.check_in, payload.check_out)

    # Lock the relevant availability rows so concurrent bookings for the same
    # room/date range serialize instead of both reading a stale remaining count.
    lock_result = await session.execute(
        select(Availability)
        .where(Availability.room_type_id == room_type.id, Availability.date.in_(nights))
        .with_for_update()
    )
    availability_by_date = {row.date: row for row in lock_result.scalars().all()}

    for day in nights:
        row = availability_by_date.get(day)
        capacity = row.rooms_available if row else 0
        held = await _held_count(session, room_type.id, day)
        if payload.payment_method == BookingSource.online and capacity - held < 1:
            raise HTTPException(
                status.HTTP_409_CONFLICT, f"No rooms available on {day.isoformat()}"
            )

    guest_result = await session.execute(select(Guest).where(Guest.email == payload.guest.email))
    guest = guest_result.scalar_one_or_none()
    if guest is None:
        guest = Guest(name=payload.guest.name, email=payload.guest.email, phone=payload.guest.phone)
        session.add(guest)
        await session.flush()

    total_amount = rate_plan.fixed_price * len(nights)
    status_ = (
        BookingStatus.pending_payment
        if payload.payment_method == BookingSource.online
        else BookingStatus.pending_whatsapp
    )

    booking = Booking(
        property_id=property_.id,
        room_type_id=room_type.id,
        rate_plan_id=rate_plan.id,
        guest_id=guest.id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests_count=payload.guests_count,
        status=status_,
        source=payload.payment_method,
        total_amount=total_amount,
    )
    session.add(booking)
    await session.flush()

    if payload.payment_method == BookingSource.online:
        session.add(
            Payment(
                booking_id=booking.id,
                gateway=PaymentGateway.stub,
                amount=total_amount,
                status=PaymentStatus.pending,
            )
        )

    await session.commit()
    await session.refresh(booking)
    return booking


async def confirm_stub_payment(session: AsyncSession, booking_id: int, email: str) -> Booking:
    """Stub stand-in for the Razorpay webhook. Booking ids are sequential and
    guessable, so this still checks the requester knows the guest's email —
    the same ownership proof GET /api/bookings/{id} requires — otherwise
    anyone could "pay" for anyone else's pending booking."""
    booking = await session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    guest = await session.get(Guest, booking.guest_id) if booking.guest_id else None
    if not guest or guest.email.lower() != email.lower():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    if booking.status != BookingStatus.pending_payment:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Booking is not awaiting payment")

    booking.status = BookingStatus.confirmed
    booking.updated_at = datetime.utcnow()
    session.add(booking)

    payment_result = await session.execute(select(Payment).where(Payment.booking_id == booking_id))
    payment = payment_result.scalar_one_or_none()
    if payment:
        payment.status = PaymentStatus.succeeded
        session.add(payment)

    await session.commit()
    await session.refresh(booking)
    return booking
