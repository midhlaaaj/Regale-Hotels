export enum BookingStatus {
  pending_payment = "pending_payment",
  confirmed = "confirmed",
  pending_whatsapp = "pending_whatsapp",
  cancelled = "cancelled",
  refunded = "refunded",
}

export enum BookingSource {
  online = "online",
  whatsapp = "whatsapp",
  manual = "manual",
}

export enum PaymentGateway {
  razorpay = "razorpay",
  stripe = "stripe",
  stub = "stub",
}

export enum PaymentStatus {
  pending = "pending",
  succeeded = "succeeded",
  failed = "failed",
  refunded = "refunded",
}

export enum UserRole {
  super_admin = "super_admin",
  property_manager = "property_manager",
}

export enum GuestVerificationStatus {
  unverified = "unverified",
  pending = "pending",
  verified = "verified",
  rejected = "rejected",
}
