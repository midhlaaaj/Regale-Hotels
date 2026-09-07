import { z } from "zod";
import { PHONE_RE } from "./public";

export const GuestSignupInSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(120)
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Name cannot be blank"),
  email: z.string().email(),
  phone: z
    .string()
    .max(20)
    .optional()
    .default("")
    .transform((v) => v.trim())
    .refine((v) => !v || PHONE_RE.test(v), "Phone number must be 7-20 digits, optionally with +, spaces, hyphens, or parentheses"),
  // bcrypt silently ignores bytes past 72 — cap here so validation, not a crash, catches it.
  password: z.string().min(8).max(72),
});

export const GuestLoginInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export const GuestProfileUpdateInSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(120)
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Name cannot be blank"),
  phone: z
    .string()
    .min(7)
    .max(20)
    .transform((v) => v.trim())
    .refine((v) => PHONE_RE.test(v), "Phone number must be 7-20 digits, optionally with +, spaces, hyphens, or parentheses"),
});
