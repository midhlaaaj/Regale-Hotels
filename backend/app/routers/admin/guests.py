from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AdminClaims, get_current_admin, scope_property_id
from app.db import get_session
from app.models import Booking, Guest, GuestVerificationStatus, UserRole
from app.schemas.admin_content import GuestVerifyIn

router = APIRouter(prefix="/api/admin/guests", tags=["admin-guests"])


async def _guest_visible_to_admin(session: AsyncSession, admin: AdminClaims, guest_id: int) -> bool:
    """A property_manager may only act on a guest who has a booking at their
    scoped property; a super_admin can act on any guest."""
    scoped_property = scope_property_id(None, admin)
    if scoped_property is None:
        return True
    query = select(Booking.id).where(Booking.guest_id == guest_id, Booking.property_id == scoped_property).limit(1)
    return (await session.execute(query)).scalar_one_or_none() is not None


@router.get("/{guest_id}")
async def get_guest(
    guest_id: int,
    admin: AdminClaims = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    guest = await session.get(Guest, guest_id)
    if not guest:
        raise HTTPException(404, "Guest not found")

    query = select(Booking).where(Booking.guest_id == guest_id)
    scoped_property = scope_property_id(None, admin)
    if scoped_property is not None:
        query = query.where(Booking.property_id == scoped_property)
    bookings = (await session.execute(query)).scalars().all()

    if admin.role == UserRole.property_manager and not bookings:
        raise HTTPException(404, "Guest not found")

    return {**guest.model_dump(), "bookings": bookings}


@router.patch("/{guest_id}/verify")
async def verify_guest(
    guest_id: int,
    payload: GuestVerifyIn,
    admin: AdminClaims = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    guest = await session.get(Guest, guest_id)
    if not guest:
        raise HTTPException(404, "Guest not found")
    if not await _guest_visible_to_admin(session, admin, guest_id):
        raise HTTPException(404, "Guest not found")

    guest.verification_status = GuestVerificationStatus(payload.status)
    guest.verification_note = payload.note
    session.add(guest)
    await session.commit()
    await session.refresh(guest)
    return guest
