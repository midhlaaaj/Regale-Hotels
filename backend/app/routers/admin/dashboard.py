from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AdminClaims, get_current_admin, scope_property_id
from app.db import get_session
from app.models import Booking, BookingStatus

router = APIRouter(prefix="/api/admin/dashboard", tags=["admin-dashboard"])


@router.get("")
async def dashboard(
    property: int | None = None,
    admin: AdminClaims = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    scoped_property = scope_property_id(property, admin)
    base = select(Booking)
    if scoped_property is not None:
        base = base.where(Booking.property_id == scoped_property)

    today = date.today()
    todays_bookings = await session.execute(
        base.where(Booking.check_in <= today, Booking.check_out > today, Booking.status == BookingStatus.confirmed)
    )
    pending_whatsapp = await session.execute(base.where(Booking.status == BookingStatus.pending_whatsapp))

    revenue_query = select(func.coalesce(func.sum(Booking.total_amount), 0)).where(
        Booking.status == BookingStatus.confirmed
    )
    if scoped_property is not None:
        revenue_query = revenue_query.where(Booking.property_id == scoped_property)
    revenue = (await session.execute(revenue_query)).scalar_one()

    return {
        "todays_bookings_count": len(todays_bookings.scalars().all()),
        "pending_whatsapp_count": len(pending_whatsapp.scalars().all()),
        "confirmed_revenue": float(revenue),
        "scoped_property_id": scoped_property,
    }
