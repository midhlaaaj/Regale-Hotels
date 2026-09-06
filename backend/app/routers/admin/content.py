from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AdminClaims, require_super_admin
from app.db import get_session
from app.models.content import SiteContent, Testimonial
from app.schemas.admin_content import AboutContentIn, HeroContentIn

router = APIRouter(prefix="/api/admin", tags=["admin-content"])


@router.get("/testimonials")
async def list_testimonials_admin(
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    result = await session.execute(select(Testimonial))
    return result.scalars().all()


@router.post("/testimonials/{testimonial_id}/approve")
async def approve_testimonial(
    testimonial_id: int,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    testimonial = await session.get(Testimonial, testimonial_id)
    if not testimonial:
        raise HTTPException(404, "Testimonial not found")
    testimonial.approved = True
    session.add(testimonial)
    await session.commit()
    await session.refresh(testimonial)
    return testimonial


@router.post("/content/hero")
async def update_hero_content(
    payload: HeroContentIn,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    value = payload.model_dump(exclude_none=True)
    result = await session.execute(select(SiteContent).where(SiteContent.key == "hero"))
    content = result.scalar_one_or_none()
    if content is None:
        content = SiteContent(key="hero", value=value)
    else:
        content.value = value
        content.updated_at = datetime.utcnow()
    session.add(content)
    await session.commit()
    await session.refresh(content)
    return content


@router.post("/content/about")
async def update_about_content(
    payload: AboutContentIn,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    value = payload.model_dump(exclude_none=True)
    result = await session.execute(select(SiteContent).where(SiteContent.key == "about"))
    content = result.scalar_one_or_none()
    if content is None:
        content = SiteContent(key="about", value=value)
    else:
        content.value = value
        content.updated_at = datetime.utcnow()
    session.add(content)
    await session.commit()
    await session.refresh(content)
    return content
