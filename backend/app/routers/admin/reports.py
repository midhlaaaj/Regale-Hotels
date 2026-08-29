from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AdminClaims, require_super_admin
from app.db import get_session
from app.models import Booking, BookingStatus

router = APIRouter(prefix="/api/admin/reports", tags=["admin-reports"])


@router.get("")
async def reports(
    type: Literal["revenue", "source", "status"] = "revenue",
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    if type == "revenue":
        result = await session.execute(
            select(Booking.property_id, func.sum(Booking.total_amount))
            .where(Booking.status == BookingStatus.confirmed)
            .group_by(Booking.property_id)
        )
    elif type == "source":
        result = await session.execute(
            select(Booking.source, func.count(Booking.id)).group_by(Booking.source)
        )
    else:
        result = await session.execute(
            select(Booking.status, func.count(Booking.id)).group_by(Booking.status)
        )
    return [{"key": str(row[0]), "value": row[1]} for row in result.all()]
