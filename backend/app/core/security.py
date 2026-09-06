import secrets
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, Request, Response, status
from jose import JWTError, jwt

from app.core.config import settings
from app.models.enums import UserRole

SESSION_COOKIE = "admin_session"
CSRF_COOKIE = "admin_csrf"
GUEST_SESSION_COOKIE = "guest_session"
GUEST_CSRF_COOKIE = "guest_csrf"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

LOGIN_RATE_LIMIT = 10
LOGIN_RATE_WINDOW = timedelta(minutes=1)
_login_attempts: dict[str, deque[datetime]] = defaultdict(deque)


def enforce_login_rate_limit(request: Request) -> None:
    """Simple in-process sliding-window limiter to slow down password brute-forcing.
    Keyed by client IP — good enough for a single-instance deployment."""
    client_ip = request.client.host if request.client else "unknown"
    now = datetime.now(timezone.utc)
    attempts = _login_attempts[client_ip]
    while attempts and now - attempts[0] > LOGIN_RATE_WINDOW:
        attempts.popleft()
    if len(attempts) >= LOGIN_RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again in a minute.",
        )
    attempts.append(now)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(*, user_id: int, role: UserRole, property_id: int | None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "property_id": property_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


class AdminClaims:
    def __init__(self, user_id: int, role: UserRole, property_id: int | None):
        self.user_id = user_id
        self.role = role
        self.property_id = property_id


class GuestClaims:
    def __init__(self, guest_id: int):
        self.guest_id = guest_id


def _set_cookie_pair(response: Response, session_cookie: str, csrf_cookie: str, token: str) -> None:
    """The JWT lives in an httpOnly cookie so it's inaccessible to JS (no XSS
    token theft). A second, JS-readable CSRF cookie is issued alongside it —
    the frontend echoes its value back as a header on mutating requests, and
    the matching get_current_* dependency checks the two match (the
    double-submit pattern). SameSite=None (rather than Lax) is required
    because the frontend/admin apps and this API are deployed on unrelated
    domains (e.g. separate *.vercel.app projects) rather than subdomains of
    one shared domain — the double-submit CSRF check above is what actually
    guards against cross-site misuse of the now cross-site-sendable cookie.
    Browsers require Secure whenever SameSite=None is used."""
    csrf_token = secrets.token_urlsafe(32)
    max_age = settings.jwt_expire_minutes * 60
    response.set_cookie(
        session_cookie, token, max_age=max_age, httponly=True,
        secure=settings.cookie_secure, samesite="none", path="/",
    )
    response.set_cookie(
        csrf_cookie, csrf_token, max_age=max_age, httponly=False,
        secure=settings.cookie_secure, samesite="none", path="/",
    )


def _clear_cookie_pair(response: Response, session_cookie: str, csrf_cookie: str) -> None:
    response.delete_cookie(session_cookie, path="/")
    response.delete_cookie(csrf_cookie, path="/")


def _check_csrf(request: Request, csrf_cookie_name: str) -> None:
    if request.method in SAFE_METHODS:
        return
    csrf_cookie = request.cookies.get(csrf_cookie_name)
    csrf_header = request.headers.get("x-csrf-token")
    if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid or missing CSRF token")


def set_session_cookies(response: Response, token: str) -> None:
    _set_cookie_pair(response, SESSION_COOKIE, CSRF_COOKIE, token)


def clear_session_cookies(response: Response) -> None:
    _clear_cookie_pair(response, SESSION_COOKIE, CSRF_COOKIE)


def get_current_admin(request: Request) -> AdminClaims:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        claims = AdminClaims(
            user_id=int(payload["sub"]),
            role=UserRole(payload["role"]),
            property_id=payload.get("property_id"),
        )
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session"
        ) from exc

    _check_csrf(request, CSRF_COOKIE)
    return claims


def create_guest_token(*, guest_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(guest_id), "typ": "guest", "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def set_guest_session_cookies(response: Response, token: str) -> None:
    _set_cookie_pair(response, GUEST_SESSION_COOKIE, GUEST_CSRF_COOKIE, token)


def clear_guest_session_cookies(response: Response) -> None:
    _clear_cookie_pair(response, GUEST_SESSION_COOKIE, GUEST_CSRF_COOKIE)


def get_current_guest(request: Request) -> GuestClaims:
    token = request.cookies.get(GUEST_SESSION_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        if payload.get("typ") != "guest":
            raise ValueError("wrong token type")
        claims = GuestClaims(guest_id=int(payload["sub"]))
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session"
        ) from exc

    _check_csrf(request, GUEST_CSRF_COOKIE)
    return claims


def require_super_admin(admin: AdminClaims = Depends(get_current_admin)) -> AdminClaims:
    if admin.role != UserRole.super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin only")
    return admin


def scope_property_id(
    requested_property_id: int | None, admin: AdminClaims
) -> int | None:
    """Never trust a client-supplied property_id for a scoped user — always
    override it with the property_id embedded in their own token."""
    if admin.role == UserRole.property_manager:
        return admin.property_id
    return requested_property_id
