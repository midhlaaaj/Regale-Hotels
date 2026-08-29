from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AdminClaims, require_super_admin
from app.db import get_session
from app.models import Property, RatePlan, RoomType
from app.schemas.admin_content import (
    PropertyCreate,
    PropertyUpdate,
    RatePlanCreate,
    RatePlanUpdate,
    RoomTypeCreate,
    RoomTypeUpdate,
)

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
