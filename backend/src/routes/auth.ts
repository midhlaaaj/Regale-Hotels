import { Router } from "express";
import { queryOne } from "../db";
import { asyncHandler, HttpError } from "../middleware/errors";
import { validateBody } from "../middleware/validate";
import { GuestLoginInSchema, GuestProfileUpdateInSchema, GuestSignupInSchema } from "../schemas/auth";
import {
  clearGuestSessionCookies,
  createGuestToken,
  enforceLoginRateLimit,
  getCurrentGuest,
  hashPassword,
  setGuestSessionCookies,
  verifyPassword,
} from "../security";
import { Guest } from "../types/models";

export const router = Router();

function toProfile(g: Guest) {
  return { id: g.id, name: g.name, email: g.email, phone: g.phone };
}

router.post(
  "/signup",
  enforceLoginRateLimit,
  validateBody(GuestSignupInSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as { name: string; email: string; phone: string; password: string };
    let guest = await queryOne<Guest>("SELECT * FROM guests WHERE email = $1", [payload.email]);

    if (guest && guest.has_account) throw new HttpError(409, "An account with this email already exists");

    const passwordHash = hashPassword(payload.password);
    if (!guest) {
      // No prior booking under this email — brand new guest record.
      guest = await queryOne<Guest>(
        `INSERT INTO guests (name, email, phone, password_hash, has_account) VALUES ($1,$2,$3,$4,true) RETURNING *`,
        [payload.name, payload.email, payload.phone, passwordHash]
      );
    } else {
      // A guest record exists from a past checkout (has_account was false) —
      // claim it rather than creating a duplicate row for the same email.
      const phone = payload.phone || guest.phone;
      guest = await queryOne<Guest>(
        `UPDATE guests SET name = $1, phone = $2, password_hash = $3, has_account = true WHERE id = $4 RETURNING *`,
        [payload.name, phone, passwordHash, guest.id]
      );
    }

    const token = createGuestToken({ guestId: guest!.id });
    setGuestSessionCookies(res, token);
    res.json(toProfile(guest!));
  })
);

router.post(
  "/login",
  enforceLoginRateLimit,
  validateBody(GuestLoginInSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as { email: string; password: string };
    const guest = await queryOne<Guest>("SELECT * FROM guests WHERE email = $1", [payload.email]);
    if (!guest || !guest.has_account || !guest.password_hash || !verifyPassword(payload.password, guest.password_hash)) {
      throw new HttpError(401, "Invalid email or password");
    }
    const token = createGuestToken({ guestId: guest.id });
    setGuestSessionCookies(res, token);
    res.json(toProfile(guest));
  })
);

router.post("/logout", (req, res) => {
  clearGuestSessionCookies(res);
  res.json({ ok: true });
});

router.get(
  "/me",
  getCurrentGuest,
  asyncHandler(async (req, res) => {
    const record = await queryOne<Guest>("SELECT * FROM guests WHERE id = $1", [req.guest!.guestId]);
    if (!record) throw new HttpError(404, "Guest not found");
    res.json(toProfile(record));
  })
);

router.patch(
  "/me",
  getCurrentGuest,
  validateBody(GuestProfileUpdateInSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as { name: string; phone: string };
    const record = await queryOne<Guest>(
      `UPDATE guests SET name = $1, phone = $2 WHERE id = $3 RETURNING *`,
      [payload.name, payload.phone, req.guest!.guestId]
    );
    if (!record) throw new HttpError(404, "Guest not found");
    res.json(toProfile(record));
  })
);
