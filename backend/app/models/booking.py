from datetime import date, datetime
from decimal import Decimal

from sqlmodel import JSON, Column, Field, SQLModel

from app.models.enums import BookingSource, BookingStatus, GuestVerificationStatus, PaymentGateway, PaymentStatus


class Guest(SQLModel, table=True):
    __tablename__ = "guests"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True)
    phone: str
    has_account: bool = False
    auth_user_id: int | None = None
    password_hash: str | None = None
    id_document_url: str | None = None
    verification_status: GuestVerificationStatus = Field(
        default=GuestVerificationStatus.unverified, index=True
    )
    verification_note: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Booking(SQLModel, table=True):
    __tablename__ = "bookings"

    id: int | None = Field(default=None, primary_key=True)
    property_id: int = Field(foreign_key="properties.id", index=True)
    room_type_id: int = Field(foreign_key="room_types.id", index=True)
    rate_plan_id: int = Field(foreign_key="rate_plans.id")
    guest_id: int | None = Field(default=None, foreign_key="guests.id")
    check_in: date
    check_out: date
    guests_count: int
    status: BookingStatus = Field(default=BookingStatus.pending_payment, index=True)
    source: BookingSource = BookingSource.online
    total_amount: Decimal = Field(max_digits=10, decimal_places=2)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Payment(SQLModel, table=True):
    __tablename__ = "payments"

    id: int | None = Field(default=None, primary_key=True)
    booking_id: int = Field(foreign_key="bookings.id", index=True)
    gateway: PaymentGateway = PaymentGateway.stub
    gateway_payment_id: str | None = None
    amount: Decimal = Field(max_digits=10, decimal_places=2)
    status: PaymentStatus = Field(default=PaymentStatus.pending, index=True)
    raw_webhook_payload: dict | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
