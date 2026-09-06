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
  room_types?: RoomType[];
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
  name: string;
  fixed_price: number;
  refundable: boolean;
  includes_breakfast: boolean;
}

export interface AvailabilityDay {
  date: string;
  rooms_available: number;
}

export interface RoomAvailability {
  room_type_id: number;
  days: AvailabilityDay[];
  rate_plans: RatePlan[];
}

export interface Testimonial {
  id: number;
  property_id: number | null;
  guest_name: string;
  guest_location: string;
  rating: number;
  quote: string;
}

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "pending_whatsapp"
  | "cancelled"
  | "refunded";

export type BookingSource = "online" | "whatsapp" | "manual";

export interface BookingCreatePayload {
  property_id: number;
  room_type_id: number;
  rate_plan_id: number;
  check_in: string;
  check_out: string;
  guests_count: number;
  payment_method: "online" | "whatsapp";
  guest: { name: string; email: string; phone: string; id_document_url?: string };
}

export interface Booking {
  id: number;
  status: BookingStatus;
  source: BookingSource;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  property_id: number;
  room_type_id: number;
}
