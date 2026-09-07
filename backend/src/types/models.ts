import { BookingSource, BookingStatus, GuestVerificationStatus, PaymentGateway, PaymentStatus, UserRole } from "./enums";

export interface Property {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  description: string;
  cover_image_url: string;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  created_at: Date;
  updated_at: Date;
}

export interface RoomType {
  id: number;
  property_id: number;
  name: string;
  description: string;
  max_occupancy: number;
  base_price: number;
  images: string[];
  created_at: Date;
  updated_at: Date;
}

export interface RatePlan {
  id: number;
  room_type_id: number;
  name: string;
  fixed_price: number;
  refundable: boolean;
  includes_breakfast: boolean;
  valid_from: string;
  valid_to: string;
}

export interface Availability {
  id: number;
  room_type_id: number;
  date: string;
  rooms_available: number;
}

export interface Package {
  id: number;
  property_id: number;
  name: string;
  nights: number;
  description: string;
  price: number;
  meal_plan: string;
  rooms_included: number;
  max_guests: number;
  cover_image_url: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string;
  has_account: boolean;
  auth_user_id: number | null;
  password_hash: string | null;
  id_document_url: string | null;
  verification_status: GuestVerificationStatus;
  verification_note: string | null;
  created_at: Date;
}

export interface Booking {
  id: number;
  property_id: number;
  room_type_id: number;
  rate_plan_id: number;
  guest_id: number | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  status: BookingStatus;
  source: BookingSource;
  total_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: number;
  booking_id: number;
  gateway: PaymentGateway;
  gateway_payment_id: string | null;
  amount: number;
  status: PaymentStatus;
  raw_webhook_payload: Record<string, unknown> | null;
  created_at: Date;
}

export interface SiteContent {
  id: number;
  key: string;
  value: Record<string, unknown>;
  updated_at: Date;
}

export interface Testimonial {
  id: number;
  property_id: number | null;
  guest_name: string;
  guest_location: string;
  rating: number;
  quote: string;
  approved: boolean;
  featured: boolean;
  created_at: Date;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  property_id: number | null;
  is_active: boolean;
  created_at: Date;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  target_type: string;
  target_id: number;
  created_at: Date;
}
