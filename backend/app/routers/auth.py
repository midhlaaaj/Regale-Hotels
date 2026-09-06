from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    GuestClaims,
    clear_guest_session_cookies,
    create_guest_token,
    enforce_login_rate_limit,
    get_current_guest,
    hash_password,
    set_guest_session_cookies,
    verify_password,
)
from app.db import get_session
from app.models import Guest
from app.schemas.auth import GuestLoginIn, GuestProfileOut, GuestProfileUpdateIn, GuestSignupIn

router = APIRouter(prefix="/api/auth", tags=["guest-auth"])


@router.post("/signup", response_model=GuestProfileOut, dependencies=[Depends(enforce_login_rate_limit)])
async def signup(payload: GuestSignupIn, response: Response, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Guest).where(Guest.email == payload.email))
    guest = result.scalar_one_or_none()

    if guest and guest.has_account:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    password_hash = hash_password(payload.password)
    if guest is None:
        # No prior booking under this email — brand new guest record.
        guest = Guest(name=payload.name, email=payload.email, phone=payload.phone)
        session.add(guest)
    else:
        # A guest record exists from a past checkout (has_account was False) —
        # claim it rather than creating a duplicate row for the same email.
        guest.name = payload.name
        if payload.phone:
            # Don't blank out a real phone from a past booking just because
            # signup didn't collect one this time.
            guest.phone = payload.phone

    guest.password_hash = password_hash
    guest.has_account = True
    session.add(guest)
    await session.commit()
    await session.refresh(guest)

    token = create_guest_token(guest_id=guest.id)
    set_guest_session_cookies(response, token)
    return GuestProfileOut(id=guest.id, name=guest.name, email=guest.email, phone=guest.phone)


@router.post("/login", response_model=GuestProfileOut, dependencies=[Depends(enforce_login_rate_limit)])
async def login(payload: GuestLoginIn, response: Response, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Guest).where(Guest.email == payload.email))
    guest = result.scalar_one_or_none()
    if not guest or not guest.has_account or not guest.password_hash or not verify_password(payload.password, guest.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = create_guest_token(guest_id=guest.id)
    set_guest_session_cookies(response, token)
    return GuestProfileOut(id=guest.id, name=guest.name, email=guest.email, phone=guest.phone)


@router.post("/logout")
async def logout(response: Response):
    clear_guest_session_cookies(response)
    return {"ok": True}


@router.get("/me", response_model=GuestProfileOut)
async def me(guest: GuestClaims = Depends(get_current_guest), session: AsyncSession = Depends(get_session)):
    record = await session.get(Guest, guest.guest_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Guest not found")
    return GuestProfileOut(id=record.id, name=record.name, email=record.email, phone=record.phone)


@router.patch("/me", response_model=GuestProfileOut)
async def update_me(
    payload: GuestProfileUpdateIn,
    guest: GuestClaims = Depends(get_current_guest),
    session: AsyncSession = Depends(get_session),
):
    record = await session.get(Guest, guest.guest_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Guest not found")
    record.name = payload.name
    record.phone = payload.phone
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return GuestProfileOut(id=record.id, name=record.name, email=record.email, phone=record.phone)
