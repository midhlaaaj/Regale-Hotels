import { z } from "zod";
import { UserRole } from "../types/enums";

export const AdminLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export const AdminUserCreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  // bcrypt silently ignores bytes past 72 — cap here so validation, not a crash, catches it.
  password: z.string().min(8).max(72),
  role: z.nativeEnum(UserRole),
  property_id: z.number().int().nullable().optional().default(null),
});
