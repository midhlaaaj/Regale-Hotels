from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Property, RoomType

router = APIRouter(prefix="/api/properties", tags=["properties"])


@router.get("")
async def list_properties(
    city: str | None = Query(default=None, max_length=100),
    session: AsyncSession = Depends(get_session),
):
    query = select(Property)
    if city:
        query = query.where(Property.city == city)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{slug}")
async def get_property(slug: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Property).where(Property.slug == slug))
    property_ = result.scalar_one_or_none()
    if not property_:
        raise HTTPException(404, "Property not found")

    rooms_result = await session.execute(select(RoomType).where(RoomType.property_id == property_.id))
    room_types = rooms_result.scalars().all()
    # SQLModel serializes Decimal as a JSON *string* by default — cast explicitly
    # so the frontend gets a real number, matching every other price field in the API.
    room_types_out = [{**r.model_dump(), "base_price": float(r.base_price)} for r in room_types]
    return {**property_.model_dump(), "room_types": room_types_out}
