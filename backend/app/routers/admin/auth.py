from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_current_admin, verify_password, AdminClaims
from app.db import get_session
from app.models import User
from app.schemas.admin import AdminLoginRequest, AdminLoginResponse

router = APIRouter(prefix="/api/admin", tags=["admin-auth"])


@router.post("/login", response_model=AdminLoginResponse)
async def login(payload: AdminLoginRequest, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = create_access_token(user_id=user.id, role=user.role, property_id=user.property_id)
    return AdminLoginResponse(
        access_token=token, role=user.role, property_id=user.property_id, name=user.name
    )


@router.get("/me")
async def me(admin: AdminClaims = Depends(get_current_admin)):
    return {"user_id": admin.user_id, "role": admin.role, "property_id": admin.property_id}
