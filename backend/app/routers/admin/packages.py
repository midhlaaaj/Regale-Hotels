from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import AdminClaims, require_super_admin
from app.db import get_session
from app.models import Package, Property
from app.schemas.admin_content import PackageCreate, PackageUpdate

router = APIRouter(prefix="/api/admin/packages", tags=["admin-packages"])


@router.get("")
async def list_packages_admin(
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    result = await session.execute(select(Package).order_by(Package.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=Package)
async def create_package(
    payload: PackageCreate,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    if not await session.get(Property, payload.property_id):
        raise HTTPException(404, "Property not found")
    package = Package(**payload.model_dump())
    session.add(package)
    await session.commit()
    await session.refresh(package)
    return package


@router.patch("/{package_id}", response_model=Package)
async def update_package(
    package_id: int,
    payload: PackageUpdate,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    package = await session.get(Package, package_id)
    if not package:
        raise HTTPException(404, "Package not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(package, key, value)
    session.add(package)
    await session.commit()
    await session.refresh(package)
    return package


@router.delete("/{package_id}", status_code=204)
async def delete_package(
    package_id: int,
    session: AsyncSession = Depends(get_session),
    admin: AdminClaims = Depends(require_super_admin),
):
    package = await session.get(Package, package_id)
    if not package:
        raise HTTPException(404, "Package not found")
    await session.delete(package)
    await session.commit()
    return Response(status_code=204)
