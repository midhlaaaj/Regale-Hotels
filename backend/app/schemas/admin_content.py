from datetime import date as date_
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.public import GuestIn

SLUG_RE = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class PropertyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    slug: str = Field(min_length=1, max_length=150, pattern=SLUG_RE)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=4000)
    cover_image_url: str = Field(min_length=1, max_length=2000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    amenities: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("amenities")
    @classmethod
    def clean_amenities(cls, v: list[str]) -> list[str]:
        cleaned = [a.strip()[:60] for a in v if a.strip()]
        if len(cleaned) != len(v):
            raise ValueError("Amenity labels cannot be blank")
        return cleaned


class PropertyUpdate(BaseModel):
    """All fields optional — only what's supplied gets patched (never id/timestamps)."""

    name: str | None = Field(default=None, min_length=1, max_length=150)
    slug: str | None = Field(default=None, min_length=1, max_length=150, pattern=SLUG_RE)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    state: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1, max_length=4000)
    cover_image_url: str | None = Field(default=None, min_length=1, max_length=2000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    amenities: list[str] | None = Field(default=None, max_length=30)


class RoomTypeCreate(BaseModel):
    property_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=4000)
    max_occupancy: int = Field(gt=0, le=20)
    base_price: Decimal = Field(gt=0, le=1_000_000)
    images: list[str] = Field(default_factory=list, max_length=30)


class RoomTypeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, min_length=1, max_length=4000)
    max_occupancy: int | None = Field(default=None, gt=0, le=20)
    base_price: Decimal | None = Field(default=None, gt=0, le=1_000_000)
    images: list[str] | None = Field(default=None, max_length=30)


class RatePlanCreate(BaseModel):
    room_type_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=100)
    fixed_price: Decimal = Field(gt=0, le=1_000_000)
    refundable: bool = True
    includes_breakfast: bool = False
    valid_from: date_
    valid_to: date_

    @field_validator("valid_to")
    @classmethod
    def validate_range(cls, v: date_, info) -> date_:
        valid_from = info.data.get("valid_from")
        if valid_from and v <= valid_from:
            raise ValueError("valid_to must be after valid_from")
        return v


class RatePlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    fixed_price: Decimal | None = Field(default=None, gt=0, le=1_000_000)
    refundable: bool | None = None
    includes_breakfast: bool | None = None
    valid_from: date_ | None = None
    valid_to: date_ | None = None


class AvailabilityDayIn(BaseModel):
    date: date_
    rooms_available: int = Field(ge=0, le=50)


class AvailabilityBulkUpsert(BaseModel):
    days: list[AvailabilityDayIn] = Field(min_length=1, max_length=120)


class GuestVerifyIn(BaseModel):
    status: Literal["verified", "rejected"]
    note: str | None = Field(default=None, max_length=500)


class AdminBookingCreate(BaseModel):
    """A staff-entered booking for a walk-in/phone reservation. property_id is
    accepted here but a scoped property_manager's own property always wins —
    see scope_property_id in routers/admin/bookings.py."""

    property_id: int = Field(gt=0)
    room_type_id: int = Field(gt=0)
    rate_plan_id: int = Field(gt=0)
    check_in: date_
    check_out: date_
    guests_count: int = Field(gt=0, le=20)
    guest: GuestIn

    @field_validator("check_out")
    @classmethod
    def validate_range(cls, v: date_, info) -> date_:
        check_in = info.data.get("check_in")
        if check_in and v <= check_in:
            raise ValueError("check_out must be after check_in")
        return v


class PackageCreate(BaseModel):
    property_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=150)
    nights: int = Field(gt=0, le=30)
    description: str = Field(min_length=1, max_length=2000)
    price: Decimal = Field(gt=0, le=1_000_000)
    meal_plan: str = Field(min_length=1, max_length=100)
    rooms_included: int = Field(default=1, gt=0, le=20)
    max_guests: int = Field(gt=0, le=40)
    cover_image_url: str | None = Field(default=None, max_length=2000)
    active: bool = True


class PackageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    nights: int | None = Field(default=None, gt=0, le=30)
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    price: Decimal | None = Field(default=None, gt=0, le=1_000_000)
    meal_plan: str | None = Field(default=None, min_length=1, max_length=100)
    rooms_included: int | None = Field(default=None, gt=0, le=20)
    max_guests: int | None = Field(default=None, gt=0, le=40)
    cover_image_url: str | None = Field(default=None, max_length=2000)
    active: bool | None = None


class HeroContentIn(BaseModel):
    """Loosely-typed content-management payload — capped to keep it from
    being used to stash arbitrarily large blobs in the DB."""

    headline: str | None = Field(default=None, max_length=200)
    subtext: str | None = Field(default=None, max_length=1000)
    cta_label: str | None = Field(default=None, max_length=60)


class AboutValueIn(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    body: str = Field(min_length=1, max_length=500)


class AboutContentIn(BaseModel):
    headline: str | None = Field(default=None, max_length=200)
    intro: str | None = Field(default=None, max_length=1500)
    story: str | None = Field(default=None, max_length=1500)
    values: list[AboutValueIn] | None = Field(default=None, max_length=6)
