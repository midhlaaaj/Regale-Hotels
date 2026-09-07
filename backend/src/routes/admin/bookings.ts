import { Router } from "express";
import { queryOne, query } from "../../db";
import { asyncHandler, HttpError } from "../../middleware/errors";
import { validateBody } from "../../middleware/validate";
import { settings } from "../../config";
import { AdminBookingCreateSchema } from "../../schemas/adminContent";
import { AdminClaims, getCurrentAdmin, scopePropertyId } from "../../security";
import { createManualBooking } from "../../services/booking";
import { BookingStatus } from "../../types/enums";
import { Booking } from "../../types/models";

export const router = Router();

router.use(getCurrentAdmin);

router.post(
  "",
  validateBody(AdminBookingCreateSchema),
  asyncHandler(async (req, res) => {
    // Logs a walk-in/phone reservation taken outside the site — payment is
    // handled by staff directly, so this creates the booking already confirmed.
    const propertyId = scopePropertyId(req.body.property_id, req.admin!);
    const booking = await createManualBooking(propertyId, req.body);
    res.json(booking);
  })
);

router.get(
  "",
  asyncHandler(async (req, res) => {
    const admin = req.admin!;
    const scopedProperty = scopePropertyId(
      req.query.property !== undefined ? parseInt(String(req.query.property), 10) : null,
      admin
    );
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const dateFrom = typeof req.query.date_from === "string" ? req.query.date_from : undefined;
    const dateTo = typeof req.query.date_to === "string" ? req.query.date_to : undefined;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "100"), 10) || 100, 1), 200);
    const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (scopedProperty !== null) {
      params.push(scopedProperty);
      conditions.push(`property_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`check_in >= $${params.length}`);
    }
    if (dateTo) {
      params.push(dateTo);
      conditions.push(`check_out <= $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(limit, offset);
    const rows = await query<Booking>(
      `SELECT * FROM bookings ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  })
);

async function getScopedBooking(admin: AdminClaims, bookingId: number): Promise<Booking> {
  const booking = await queryOne<Booking>("SELECT * FROM bookings WHERE id = $1", [bookingId]);
  if (!booking) throw new HttpError(404, "Booking not found");
  const scoped = scopePropertyId(booking.property_id, admin);
  if (scoped !== booking.property_id) throw new HttpError(404, "Booking not found");
  return booking;
}

router.patch(
  "/:bookingId/confirm",
  asyncHandler(async (req, res) => {
    const booking = await getScopedBooking(req.admin!, parseInt(req.params.bookingId, 10));
    if (booking.status !== BookingStatus.pending_whatsapp) {
      throw new HttpError(400, "Only pending WhatsApp bookings can be confirmed this way");
    }
    const updated = await queryOne<Booking>(
      `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [BookingStatus.confirmed, booking.id]
    );
    res.json(updated);
  })
);

router.patch(
  "/:bookingId/cancel",
  asyncHandler(async (req, res) => {
    const booking = await getScopedBooking(req.admin!, parseInt(req.params.bookingId, 10));
    const updated = await queryOne<Booking>(
      `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [BookingStatus.cancelled, booking.id]
    );
    res.json(updated);
  })
);

router.post(
  "/:bookingId/refund",
  asyncHandler(async (req, res) => {
    // Stub — flips status to refunded. Replace with a real Razorpay refund call
    // once sandbox keys are wired up; payments.status must then only change via that call.
    // Gated by payments_stub_mode so this can't fake a refund once a real gateway is live.
    if (!settings.paymentsStubMode) throw new HttpError(501, "Refund is not implemented");
    const booking = await getScopedBooking(req.admin!, parseInt(req.params.bookingId, 10));
    if (booking.status !== BookingStatus.confirmed) throw new HttpError(400, "Only confirmed bookings can be refunded");
    const updated = await queryOne<Booking>(
      `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [BookingStatus.refunded, booking.id]
    );
    res.json(updated);
  })
);
