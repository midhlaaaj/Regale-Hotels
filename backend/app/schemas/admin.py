from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    property_id: int | None
    name: str


class AdminUserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    # bcrypt silently ignores bytes past 72 — cap here so validation, not a crash, catches it.
    password: str = Field(min_length=8, max_length=72)
    role: UserRole
    property_id: int | None = None
