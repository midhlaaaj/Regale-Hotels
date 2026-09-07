import { z } from "zod";

export const PHONE_RE = /^\+?[0-9 \-()]{7,20}$/;

export const GuestInSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(120)
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Name cannot be blank"),
  email: z.string().email(),
  phone: z
    .string()
    .min(7)
    .max(20)
    .transform((v) => v.trim())
    .refine((v) => PHONE_RE.test(v), "Phone number must be 7-20 digits, optionally with +, spaces, hyphens, or parentheses"),
  id_document_url: z.string().max(2000).nullable().optional().default(null),
});
export type GuestIn = z.infer<typeof GuestInSchema>;

export const BookingCreateSchema = z.object({
  property_id: z.number().int().positive(),
  room_type_id: z.number().int().positive(),
  rate_plan_id: z.number().int().positive(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  guests_count: z.number().int().positive().max(20),
  payment_method: z.enum(["online", "whatsapp"]),
  guest: GuestInSchema,
});
export type BookingCreate = z.infer<typeof BookingCreateSchema>;

export const ConfirmPaymentInSchema = z.object({
  email: z.string().email(),
});

export const BookingCancelInSchema = z.object({
  email: z.string().email(),
});
