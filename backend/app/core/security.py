from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.models.enums import UserRole

bearer_scheme = HTTPBearer()


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


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> AdminClaims:
    try:
        payload = jwt.decode(
            credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        return AdminClaims(
            user_id=int(payload["sub"]),
            role=UserRole(payload["role"]),
            property_id=payload.get("property_id"),
        )
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        ) from exc


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
