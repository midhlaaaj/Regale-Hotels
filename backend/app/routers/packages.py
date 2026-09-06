from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Package, Property

router = APIRouter(prefix="/api/packages", tags=["packages"])


@router.get("")
async def list_packages(
    property: int | None = None,
    session: AsyncSession = Depends(get_session),
):
    query = select(Package, Property).join(Property, Package.property_id == Property.id).where(Package.active.is_(True))
    if property is not None:
        query = query.where(Package.property_id == property)
    result = await session.execute(query.order_by(Package.created_at.desc()))
    return [
        {
            **pkg.model_dump(),
            "price": float(pkg.price),
            "cover_image_url": pkg.cover_image_url or prop.cover_image_url,
            "property_name": prop.name,
            "property_slug": prop.slug,
            "property_city": prop.city,
        }
        for pkg, prop in result.all()
    ]
