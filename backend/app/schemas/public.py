import re
from datetime import date as date_
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import BookingStatus

PHONE_RE = re.compile(r"^\+?[0-9 \-()]{7,20}$")


class GuestIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not PHONE_RE.match(v):
            raise ValueError("Phone number must be 7-20 digits, optionally with +, spaces, hyphens, or parentheses")
        return v


class BookingCreate(BaseModel):
    property_id: int = Field(gt=0)
    room_type_id: int = Field(gt=0)
    rate_plan_id: int = Field(gt=0)
    check_in: date_
    check_out: date_
    guests_count: int = Field(gt=0, le=20)
    # "manual" is admin-only (see admin/bookings.py) — never accepted from the public API.
    payment_method: Literal["online", "whatsapp"]
    guest: GuestIn


class ConfirmPaymentIn(BaseModel):
    email: EmailStr


class BookingOut(BaseModel):
    id: int
    status: BookingStatus
    source: str
    check_in: date_
    check_out: date_
    guests_count: int
    total_amount: float
    property_id: int
    room_type_id: int


class RatePlanOut(BaseModel):
    id: int
    name: str
    fixed_price: float
    refundable: bool
    includes_breakfast: bool


class AvailabilityDayOut(BaseModel):
    date: date_
    rooms_available: int


class RoomAvailabilityOut(BaseModel):
    room_type_id: int
    days: list[AvailabilityDayOut]
    rate_plans: list[RatePlanOut]
