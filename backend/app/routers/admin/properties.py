from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AdminClaims, require_super_admin
from app.db import get_session
from app.models import Availability, Booking, Property, RatePlan, RoomType
from app.schemas.admin_content import (
    AvailabilityBulkUpsert,
    PropertyCreate,
    PropertyUpdate,
    RatePlanCreate,
    RatePlanUpdate,
    RoomTypeCreate,
    RoomTypeUpdate,
)

MAX_AVAILABILITY_RANGE_DAYS = 120


async def _assert_no_bookings(session: AsyncSession, column, value, what: str) -> None:
    existing = await session.execute(select(Booking.id).where(column == value).limit(1))
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"Cannot delete a {what} with existing bookings")

router = APIRouter(prefix="/api/admin", tags=["admin-properties"])


@router.get("/properties")
async def list_properties_admin(
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    result = await session.execute(select(Property))
    return result.scalars().all()


@router.post("/properties", response_model=Property)
async def create_property(
    payload: PropertyCreate,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    existing = await session.execute(select(Property).where(Property.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "A property with this slug already exists")
    property_ = Property(**payload.model_dump())
    session.add(property_)
    await session.commit()
    await session.refresh(property_)
    return property_


@router.patch("/properties/{property_id}", response_model=Property)
async def update_property(
    property_id: int,
    payload: PropertyUpdate,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    property_ = await session.get(Property, property_id)
    if not property_:
        raise HTTPException(404, "Property not found")
    updates = payload.model_dump(exclude_unset=True)
    if "slug" in updates and updates["slug"] != property_.slug:
        existing = await session.execute(select(Property).where(Property.slug == updates["slug"]))
        if existing.scalar_one_or_none():
            raise HTTPException(409, "A property with this slug already exists")
    for key, value in updates.items():
        setattr(property_, key, value)
    session.add(property_)
    await session.commit()
    await session.refresh(property_)
    return property_


@router.post("/room-types", response_model=RoomType)
async def create_room_type(
    payload: RoomTypeCreate,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    if not await session.get(Property, payload.property_id):
        raise HTTPException(404, "Property not found")
    room_type = RoomType(**payload.model_dump())
    session.add(room_type)
    await session.commit()
    await session.refresh(room_type)
    return room_type


@router.patch("/room-types/{room_type_id}", response_model=RoomType)
async def update_room_type(
    room_type_id: int,
    payload: RoomTypeUpdate,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    room_type = await session.get(RoomType, room_type_id)
    if not room_type:
        raise HTTPException(404, "Room type not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(room_type, key, value)
    session.add(room_type)
    await session.commit()
    await session.refresh(room_type)
    return room_type


@router.post("/rate-plans", response_model=RatePlan)
async def create_rate_plan(
    payload: RatePlanCreate,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    if not await session.get(RoomType, payload.room_type_id):
        raise HTTPException(404, "Room type not found")
    rate_plan = RatePlan(**payload.model_dump())
    session.add(rate_plan)
    await session.commit()
    await session.refresh(rate_plan)
    return rate_plan


@router.patch("/rate-plans/{rate_plan_id}", response_model=RatePlan)
async def update_rate_plan(
    rate_plan_id: int,
    payload: RatePlanUpdate,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    rate_plan = await session.get(RatePlan, rate_plan_id)
    if not rate_plan:
        raise HTTPException(404, "Rate plan not found")
    updates = payload.model_dump(exclude_unset=True)
    valid_from = updates.get("valid_from", rate_plan.valid_from)
    valid_to = updates.get("valid_to", rate_plan.valid_to)
    if valid_to <= valid_from:
        raise HTTPException(400, "valid_to must be after valid_from")
    for key, value in updates.items():
        setattr(rate_plan, key, value)
    session.add(rate_plan)
    await session.commit()
    await session.refresh(rate_plan)
    return rate_plan


@router.delete("/rate-plans/{rate_plan_id}", status_code=204)
async def delete_rate_plan(
    rate_plan_id: int,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    rate_plan = await session.get(RatePlan, rate_plan_id)
    if not rate_plan:
        raise HTTPException(404, "Rate plan not found")
    await _assert_no_bookings(session, Booking.rate_plan_id, rate_plan_id, "rate plan")
    await session.delete(rate_plan)
    await session.commit()
    return Response(status_code=204)


@router.delete("/room-types/{room_type_id}", status_code=204)
async def delete_room_type(
    room_type_id: int,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    room_type = await session.get(RoomType, room_type_id)
    if not room_type:
        raise HTTPException(404, "Room type not found")
    await _assert_no_bookings(session, Booking.room_type_id, room_type_id, "room type")
    await session.execute(delete(RatePlan).where(RatePlan.room_type_id == room_type_id))
    await session.execute(delete(Availability).where(Availability.room_type_id == room_type_id))
    await session.delete(room_type)
    await session.commit()
    return Response(status_code=204)


@router.delete("/properties/{property_id}", status_code=204)
async def delete_property(
    property_id: int,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    property_ = await session.get(Property, property_id)
    if not property_:
        raise HTTPException(404, "Property not found")
    await _assert_no_bookings(session, Booking.property_id, property_id, "property")

    room_type_ids_result = await session.execute(
        select(RoomType.id).where(RoomType.property_id == property_id)
    )
    room_type_ids = room_type_ids_result.scalars().all()
    if room_type_ids:
        await session.execute(delete(RatePlan).where(RatePlan.room_type_id.in_(room_type_ids)))
        await session.execute(delete(Availability).where(Availability.room_type_id.in_(room_type_ids)))
    await session.execute(delete(RoomType).where(RoomType.property_id == property_id))
    await session.delete(property_)
    await session.commit()
    return Response(status_code=204)


@router.get("/room-types/{room_type_id}/availability")
async def get_room_type_availability(
    room_type_id: int,
    date_from: date,
    date_to: date,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    if not await session.get(RoomType, room_type_id):
        raise HTTPException(404, "Room type not found")
    if date_from >= date_to:
        raise HTTPException(400, "date_to must be after date_from")
    if (date_to - date_from).days > MAX_AVAILABILITY_RANGE_DAYS:
        raise HTTPException(400, f"Range cannot exceed {MAX_AVAILABILITY_RANGE_DAYS} days")

    days = [date_from + timedelta(days=i) for i in range((date_to - date_from).days)]
    result = await session.execute(
        select(Availability).where(
            Availability.room_type_id == room_type_id, Availability.date.in_(days)
        )
    )
    by_date = {row.date: row.rooms_available for row in result.scalars().all()}
    return [{"date": d, "rooms_available": by_date.get(d, 0)} for d in days]


@router.put("/room-types/{room_type_id}/availability")
async def upsert_room_type_availability(
    room_type_id: int,
    payload: AvailabilityBulkUpsert,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    if not await session.get(RoomType, room_type_id):
        raise HTTPException(404, "Room type not found")

    dates = [d.date for d in payload.days]
    existing_result = await session.execute(
        select(Availability).where(
            Availability.room_type_id == room_type_id, Availability.date.in_(dates)
        )
    )
    existing_by_date = {row.date: row for row in existing_result.scalars().all()}

    for day in payload.days:
        row = existing_by_date.get(day.date)
        if row:
            row.rooms_available = day.rooms_available
            session.add(row)
        else:
            session.add(
                Availability(room_type_id=room_type_id, date=day.date, rooms_available=day.rooms_available)
            )
    await session.commit()
    return {"updated": len(payload.days)}
