from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Testimonial

router = APIRouter(prefix="/api/testimonials", tags=["testimonials"])


@router.get("")
async def list_testimonials(
    property: int | None = None,
    session: AsyncSession = Depends(get_session),
):
    query = select(Testimonial).where(Testimonial.approved.is_(True))
    if property is not None:
        query = query.where(Testimonial.property_id == property)
    result = await session.execute(query)
    return result.scalars().all()
