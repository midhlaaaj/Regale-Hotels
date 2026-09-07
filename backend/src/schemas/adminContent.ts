import { z } from "zod";
import { GuestInSchema } from "./public";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const PropertyCreateSchema = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(150).regex(SLUG_RE),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  description: z.string().min(1).max(4000),
  cover_image_url: z.string().min(1).max(2000),
  latitude: z.number().min(-90).max(90).nullable().optional().default(null),
  longitude: z.number().min(-180).max(180).nullable().optional().default(null),
  amenities: z.array(z.string()).max(30).default([]),
});
export type PropertyCreate = z.infer<typeof PropertyCreateSchema>;

export const PropertyUpdateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  slug: z.string().min(1).max(150).regex(SLUG_RE).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(4000).optional(),
  cover_image_url: z.string().min(1).max(2000).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  amenities: z.array(z.string()).max(30).optional(),
});

export const RoomTypeCreateSchema = z.object({
  property_id: z.number().int().positive(),
  name: z.string().min(1).max(150),
  description: z.string().min(1).max(4000),
  max_occupancy: z.number().int().positive().max(20),
  base_price: z.number().positive().max(1_000_000),
  images: z.array(z.string()).max(30).default([]),
});

export const RoomTypeUpdateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().min(1).max(4000).optional(),
  max_occupancy: z.number().int().positive().max(20).optional(),
  base_price: z.number().positive().max(1_000_000).optional(),
  images: z.array(z.string()).max(30).optional(),
});

export const RatePlanCreateSchema = z
  .object({
    room_type_id: z.number().int().positive(),
    name: z.string().min(1).max(100),
    fixed_price: z.number().positive().max(1_000_000),
    refundable: z.boolean().default(true),
    includes_breakfast: z.boolean().default(false),
    valid_from: z.string().regex(DATE_RE),
    valid_to: z.string().regex(DATE_RE),
  })
  .refine((v) => v.valid_to > v.valid_from, { message: "valid_to must be after valid_from", path: ["valid_to"] });

export const RatePlanUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  fixed_price: z.number().positive().max(1_000_000).optional(),
  refundable: z.boolean().optional(),
  includes_breakfast: z.boolean().optional(),
  valid_from: z.string().regex(DATE_RE).optional(),
  valid_to: z.string().regex(DATE_RE).optional(),
});

export const AvailabilityDayInSchema = z.object({
  date: z.string().regex(DATE_RE),
  rooms_available: z.number().int().min(0).max(50),
});

export const AvailabilityBulkUpsertSchema = z.object({
  days: z.array(AvailabilityDayInSchema).min(1).max(120),
});

export const GuestVerifyInSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  note: z.string().max(500).nullable().optional().default(null),
});

export const AdminBookingCreateSchema = z
  .object({
    property_id: z.number().int().positive(),
    room_type_id: z.number().int().positive(),
    rate_plan_id: z.number().int().positive(),
    check_in: z.string().regex(DATE_RE),
    check_out: z.string().regex(DATE_RE),
    guests_count: z.number().int().positive().max(20),
    guest: GuestInSchema,
  })
  .refine((v) => v.check_out > v.check_in, { message: "check_out must be after check_in", path: ["check_out"] });
export type AdminBookingCreate = z.infer<typeof AdminBookingCreateSchema>;

export const PackageCreateSchema = z.object({
  property_id: z.number().int().positive(),
  name: z.string().min(1).max(150),
  nights: z.number().int().positive().max(30),
  description: z.string().min(1).max(2000),
  price: z.number().positive().max(1_000_000),
  meal_plan: z.string().min(1).max(100),
  rooms_included: z.number().int().positive().max(20).default(1),
  max_guests: z.number().int().positive().max(40),
  cover_image_url: z.string().max(2000).nullable().optional().default(null),
  active: z.boolean().default(true),
});

export const PackageUpdateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  nights: z.number().int().positive().max(30).optional(),
  description: z.string().min(1).max(2000).optional(),
  price: z.number().positive().max(1_000_000).optional(),
  meal_plan: z.string().min(1).max(100).optional(),
  rooms_included: z.number().int().positive().max(20).optional(),
  max_guests: z.number().int().positive().max(40).optional(),
  cover_image_url: z.string().max(2000).nullable().optional(),
  active: z.boolean().optional(),
});

export const HeroContentInSchema = z.object({
  headline: z.string().max(200).nullable().optional(),
  subtext: z.string().max(1000).nullable().optional(),
  cta_label: z.string().max(60).nullable().optional(),
});

const AboutValueInSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
});

export const AboutContentInSchema = z.object({
  headline: z.string().max(200).nullable().optional(),
  intro: z.string().max(1500).nullable().optional(),
  story: z.string().max(1500).nullable().optional(),
  values: z.array(AboutValueInSchema).max(6).nullable().optional(),
});
