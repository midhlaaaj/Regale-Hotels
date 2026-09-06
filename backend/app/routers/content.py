from fastapi import APIRouter, Depends, Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import SiteContent

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/{key}")
async def get_content(
    key: str = Path(min_length=1, max_length=50, pattern=r"^[a-z_]+$"),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(SiteContent).where(SiteContent.key == key))
    content = result.scalar_one_or_none()
    return content.value if content else {}
