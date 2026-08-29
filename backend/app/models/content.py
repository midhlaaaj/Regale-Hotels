from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class SiteContent(SQLModel, table=True):
    """Generic key/value store for admin-editable content (hero copy, offers, etc).
    Keeps the content-management surface simple without a dedicated table per content type."""

    __tablename__ = "site_content"

    id: int | None = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)
    value: dict = Field(default_factory=dict, sa_column=Column(JSON))
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Testimonial(SQLModel, table=True):
    __tablename__ = "testimonials"

    id: int | None = Field(default=None, primary_key=True)
    property_id: int | None = Field(default=None, foreign_key="properties.id", index=True)
    guest_name: str
    guest_location: str
    rating: int
    quote: str
    approved: bool = False
    featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
