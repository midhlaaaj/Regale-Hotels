from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Availability, RatePlan, RoomType
from app.schemas.public import AvailabilityDayOut, RatePlanOut, RoomAvailabilityOut

router = APIRouter(prefix="/api/room-types", tags=["room-types"])

MAX_AVAILABILITY_RANGE_DAYS = 60


@router.get("/{room_type_id}", response_model=RoomType)
async def get_room_type(room_type_id: int, session: AsyncSession = Depends(get_session)):
    room_type = await session.get(RoomType, room_type_id)
    if not room_type:
        raise HTTPException(404, "Room type not found")
    return room_type


@router.get("/{room_type_id}/availability", response_model=RoomAvailabilityOut)
async def get_availability(
    room_type_id: int,
    checkin: date,
    checkout: date,
    session: AsyncSession = Depends(get_session),
):
    if checkin >= checkout:
        raise HTTPException(400, "checkout must be after checkin")
    if (checkout - checkin).days > MAX_AVAILABILITY_RANGE_DAYS:
        raise HTTPException(400, f"Date range cannot exceed {MAX_AVAILABILITY_RANGE_DAYS} days")

    days = [checkin + timedelta(days=i) for i in range((checkout - checkin).days)]
    avail_result = await session.execute(
        select(Availability).where(
            Availability.room_type_id == room_type_id, Availability.date.in_(days)
        )
    )
    by_date = {row.date: row.rooms_available for row in avail_result.scalars().all()}

    rates_result = await session.execute(
        select(RatePlan).where(
            RatePlan.room_type_id == room_type_id,
            RatePlan.valid_from <= checkin,
            RatePlan.valid_to >= checkout,
        )
    )
    rate_plans = rates_result.scalars().all()

    return RoomAvailabilityOut(
        room_type_id=room_type_id,
        days=[AvailabilityDayOut(date=d, rooms_available=by_date.get(d, 0)) for d in days],
        rate_plans=[
            RatePlanOut(
                id=r.id,
                name=r.name,
                fixed_price=float(r.fixed_price),
                refundable=r.refundable,
                includes_breakfast=r.includes_breakfast,
            )
            for r in rate_plans
        ],
    )
