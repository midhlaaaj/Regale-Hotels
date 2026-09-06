import socket
import ssl
from collections.abc import AsyncGenerator
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Passing a bare ssl-mode *string* (e.g. "require") makes asyncpg 0.30+ attempt
# its newer "direct TLS negotiation" path (loop.create_connection(ssl=...)) —
# which crashed with "OSError: [Errno 16] Device or resource busy" under
# Vercel's Lambda-based Python runtime, a known uvloop/sandbox incompatibility.
# Passing a real SSLContext instead makes asyncpg fall back to the classic
# STARTTLS-style negotiation (loop.start_tls()), which doesn't hit that path.
_ssl_context = ssl.create_default_context()

# Separately: plain DNS resolution (socket.getaddrinfo) can also throw that
# same "Device or resource busy" error in Lambda-based sandboxes — a known,
# apparently IPv6/dual-stack-related quirk of that environment, unrelated to
# our code. Forcing IPv4-only resolution process-wide is the standard
# workaround; harmless locally since IPv4 always works there too.
_orig_getaddrinfo = socket.getaddrinfo


def _ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)


socket.getaddrinfo = _ipv4_only_getaddrinfo


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
    connect_args={"ssl": _ssl_context},
)
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
