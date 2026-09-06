from datetime import datetime

from sqlalchemy import CheckConstraint
from sqlmodel import Field, SQLModel

from app.models.enums import UserRole


class User(SQLModel, table=True):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "(role = 'property_manager' AND property_id IS NOT NULL) OR "
            "(role = 'super_admin' AND property_id IS NULL)",
            name="ck_users_property_scope",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: UserRole
    property_id: int | None = Field(default=None, foreign_key="properties.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_log"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    action: str
    target_type: str
    target_id: int
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
