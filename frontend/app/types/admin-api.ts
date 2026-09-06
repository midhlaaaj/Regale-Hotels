export interface Property {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  description: string;
  cover_image_url: string;
  amenities: string[];
}

export interface RoomType {
  id: number;
  property_id: number;
  name: string;
  description: string;
  max_occupancy: number;
  base_price: number;
  images: string[];
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

export type BookingStatus = "pending_payment" | "confirmed" | "pending_whatsapp" | "cancelled" | "refunded";
export type BookingSource = "online" | "whatsapp" | "manual";

export interface AdminBooking {
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
  total_amount: string | number;
  created_at: string;
  updated_at: string;
}

export type GuestVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string;
  has_account: boolean;
  id_document_url: string | null;
  verification_status: GuestVerificationStatus;
  verification_note: string | null;
  created_at: string;
  bookings?: AdminBooking[];
}

export interface AvailabilityDay {
  date: string;
  rooms_available: number;
}

export interface DashboardData {
  todays_bookings_count: number;
  pending_whatsapp_count: number;
  confirmed_revenue: number;
  scoped_property_id: number | null;
}

export interface ReportRow {
  key: string;
  value: number;
}
