from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AdminClaims, hash_password, require_super_admin
from app.db import get_session
from app.models import Property, User
from app.schemas.admin import AdminUserCreate

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


@router.get("")
async def list_users(
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    result = await session.execute(select(User).order_by(User.created_at))
    return [
        {
            "id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "property_id": u.property_id, "is_active": u.is_active,
        }
        for u in result.scalars().all()
    ]


@router.post("")
async def create_user(
    payload: AdminUserCreate,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    if payload.role.value == "property_manager" and payload.property_id is None:
        raise HTTPException(400, "property_manager accounts must have a property_id")
    if payload.role.value == "super_admin" and payload.property_id is not None:
        raise HTTPException(400, "super_admin accounts must not have a property_id")
    if payload.property_id is not None and not await session.get(Property, payload.property_id):
        raise HTTPException(404, "Property not found")

    existing = await session.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "An account with this email already exists")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        property_id=payload.property_id,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


@router.patch("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    if user_id == admin.user_id:
        raise HTTPException(400, "You cannot deactivate your own account")
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = False
    session.add(user)
    await session.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.patch("/{user_id}/reactivate")
async def reactivate_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = True
    session.add(user)
    await session.commit()
    return {"id": user.id, "is_active": user.is_active}
