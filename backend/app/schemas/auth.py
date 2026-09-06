from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.public import PHONE_RE


class GuestSignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    # Optional at signup — a phone is still collected/required at actual checkout
    # (see BookingCreate.guest in app/schemas/public.py); this just isn't a
    # gate on creating an account.
    phone: str = Field(default="", max_length=20)
    # bcrypt silently ignores bytes past 72 — cap here so validation, not a crash, catches it.
    password: str = Field(min_length=8, max_length=72)

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
        if v and not PHONE_RE.match(v):
            raise ValueError("Phone number must be 7-20 digits, optionally with +, spaces, hyphens, or parentheses")
        return v


class GuestLoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class GuestProfileOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str


class GuestProfileUpdateIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
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
