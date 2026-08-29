from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AdminClaims, get_current_admin, scope_property_id
from app.db import get_session
from app.models import Booking, Guest

router = APIRouter(prefix="/api/admin/guests", tags=["admin-guests"])


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

    if admin.role.value == "property_manager" and not bookings:
        raise HTTPException(404, "Guest not found")

    return {**guest.model_dump(), "bookings": bookings}
