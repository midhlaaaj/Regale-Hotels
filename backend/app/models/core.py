from datetime import date as date_
from datetime import datetime
from decimal import Decimal

from sqlalchemy import UniqueConstraint
from sqlmodel import JSON, Column, Field, SQLModel


class Property(SQLModel, table=True):
    __tablename__ = "properties"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    city: str
    state: str
    description: str
    cover_image_url: str
    latitude: float | None = None
    longitude: float | None = None
    amenities: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RoomType(SQLModel, table=True):
    __tablename__ = "room_types"

    id: int | None = Field(default=None, primary_key=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    name: str
    description: str
    max_occupancy: int
    base_price: Decimal = Field(max_digits=10, decimal_places=2)
    images: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RatePlan(SQLModel, table=True):
    __tablename__ = "rate_plans"

    id: int | None = Field(default=None, primary_key=True)
    room_type_id: int = Field(foreign_key="room_types.id", index=True)
    name: str
    fixed_price: Decimal = Field(max_digits=10, decimal_places=2)
    refundable: bool = True
    includes_breakfast: bool = False
    valid_from: date_
    valid_to: date_


class Availability(SQLModel, table=True):
    __tablename__ = "availability"
    __table_args__ = (UniqueConstraint("room_type_id", "date", name="uq_availability_room_date"),)

    id: int | None = Field(default=None, primary_key=True)
    room_type_id: int = Field(foreign_key="room_types.id", index=True)
    date: date_ = Field(index=True)
    rooms_available: int


class Package(SQLModel, table=True):
    """A fixed-duration stay bundle (e.g. "5 nights, 4 days, all meals") priced
    as a whole rather than composed from RatePlan/Availability — staff enter
    these by hand, they aren't derived from the nightly booking engine."""

    __tablename__ = "packages"

    id: int | None = Field(default=None, primary_key=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    name: str
    nights: int
    description: str
    price: Decimal = Field(max_digits=10, decimal_places=2)
    meal_plan: str
    rooms_included: int = 1
    max_guests: int
    cover_image_url: str | None = None
    active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
