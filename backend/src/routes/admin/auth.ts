import { Router } from "express";
import { queryOne } from "../../db";
import { asyncHandler, HttpError } from "../../middleware/errors";
import { validateBody } from "../../middleware/validate";
import { AdminLoginRequestSchema } from "../../schemas/admin";
import {
  clearSessionCookies,
  createAccessToken,
  enforceLoginRateLimit,
  getCurrentAdmin,
  setSessionCookies,
  verifyPassword,
} from "../../security";
import { User } from "../../types/models";

export const router = Router();

router.post(
  "/login",
  enforceLoginRateLimit,
  validateBody(AdminLoginRequestSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as { email: string; password: string };
    const user = await queryOne<User>("SELECT * FROM users WHERE email = $1", [payload.email]);
    if (!user || !verifyPassword(payload.password, user.password_hash)) {
      throw new HttpError(401, "Invalid email or password");
    }
    if (!user.is_active) throw new HttpError(401, "Invalid email or password");

    const token = createAccessToken({ userId: user.id, role: user.role, propertyId: user.property_id });
    setSessionCookies(res, token);
    res.json({ role: user.role, property_id: user.property_id, name: user.name });
  })
);

router.post("/logout", (_req, res) => {
  clearSessionCookies(res);
  res.json({ ok: true });
});

router.get("/me", getCurrentAdmin, (req, res) => {
  res.json({ user_id: req.admin!.userId, role: req.admin!.role, property_id: req.admin!.propertyId });
});
