import { Router } from "express";
import { query, queryOne } from "../../db";
import { asyncHandler, HttpError } from "../../middleware/errors";
import { validateBody } from "../../middleware/validate";
import { GuestVerifyInSchema } from "../../schemas/adminContent";
import { AdminClaims, getCurrentAdmin, scopePropertyId } from "../../security";
import { UserRole } from "../../types/enums";
import { Booking, Guest } from "../../types/models";

export const router = Router();

router.use(getCurrentAdmin);

/** A property_manager may only act on a guest who has a booking at their
 * scoped property; a super_admin can act on any guest. */
async function guestVisibleToAdmin(admin: AdminClaims, guestId: number): Promise<boolean> {
  const scopedProperty = scopePropertyId(null, admin);
  if (scopedProperty === null) return true;
  const row = await queryOne(`SELECT id FROM bookings WHERE guest_id = $1 AND property_id = $2 LIMIT 1`, [
    guestId,
    scopedProperty,
  ]);
  return row !== null;
}

router.get(
  "/:guestId",
  asyncHandler(async (req, res) => {
    const guestId = parseInt(req.params.guestId, 10);
    const guest = await queryOne<Guest>("SELECT * FROM guests WHERE id = $1", [guestId]);
    if (!guest) throw new HttpError(404, "Guest not found");

    const scopedProperty = scopePropertyId(null, req.admin!);
    const bookings =
      scopedProperty !== null
        ? await query<Booking>("SELECT * FROM bookings WHERE guest_id = $1 AND property_id = $2", [guestId, scopedProperty])
        : await query<Booking>("SELECT * FROM bookings WHERE guest_id = $1", [guestId]);

    if (req.admin!.role === UserRole.property_manager && bookings.length === 0) {
      throw new HttpError(404, "Guest not found");
    }

    res.json({ ...guest, bookings });
  })
);

router.patch(
  "/:guestId/verify",
  validateBody(GuestVerifyInSchema),
  asyncHandler(async (req, res) => {
    const guestId = parseInt(req.params.guestId, 10);
    const guest = await queryOne<Guest>("SELECT * FROM guests WHERE id = $1", [guestId]);
    if (!guest) throw new HttpError(404, "Guest not found");
    if (!(await guestVisibleToAdmin(req.admin!, guestId))) throw new HttpError(404, "Guest not found");

    const payload = req.body as { status: "verified" | "rejected"; note: string | null };
    const updated = await queryOne<Guest>(
      `UPDATE guests SET verification_status = $1, verification_note = $2 WHERE id = $3 RETURNING *`,
      [payload.status, payload.note, guestId]
    );
    res.json(updated);
  })
);
