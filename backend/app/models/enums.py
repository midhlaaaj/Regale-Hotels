from enum import Enum


class BookingStatus(str, Enum):
    pending_payment = "pending_payment"
    confirmed = "confirmed"
    pending_whatsapp = "pending_whatsapp"
    cancelled = "cancelled"
    refunded = "refunded"


class BookingSource(str, Enum):
    online = "online"
    whatsapp = "whatsapp"
    manual = "manual"


class PaymentGateway(str, Enum):
    razorpay = "razorpay"
    stripe = "stripe"
    stub = "stub"


class PaymentStatus(str, Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"


class UserRole(str, Enum):
    super_admin = "super_admin"
    property_manager = "property_manager"
