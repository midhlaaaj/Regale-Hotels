from collections.abc import AsyncGenerator
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


def _normalized_url(url: str) -> str:
    """asyncpg doesn't accept libpq-style query params (sslmode, channel_binding)
    passed through SQLAlchemy's URL as connect() kwargs, so strip them and set
    SSL explicitly via connect_args instead."""
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


engine = create_async_engine(
    _normalized_url(settings.database_url),
    pool_size=5,
    max_overflow=2,
    # Neon (and most poolers) will silently drop idle connections server-side —
    # without pre_ping, SQLAlchemy hands out the dead connection and the next
    # query 500s with "connection is closed". pool_recycle forces a refresh
    # before Neon's own idle timeout gets a chance to close it underneath us.
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"ssl": "require"},
)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
