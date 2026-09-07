import { Router } from "express";
import { settings } from "../config";
import { query, queryOne } from "../db";
import { asyncHandler, HttpError } from "../middleware/errors";
import { validateBody } from "../middleware/validate";
import { BookingCancelInSchema, BookingCreateSchema, ConfirmPaymentInSchema } from "../schemas/public";
import { getCurrentGuest } from "../security";
import { cancelOwnBooking, confirmStubPayment, createBooking } from "../services/booking";
import { Booking, Guest } from "../types/models";

export const router = Router();

function toOut(booking: Booking) {
  return {
    id: booking.id,
    status: booking.status,
    source: booking.source,
    check_in: booking.check_in,
    check_out: booking.check_out,
    guests_count: booking.guests_count,
    total_amount: booking.total_amount,
    property_id: booking.property_id,
    room_type_id: booking.room_type_id,
  };
}

router.post(
  "",
  validateBody(BookingCreateSchema),
  asyncHandler(async (req, res) => {
    const booking = await createBooking(req.body);
    res.json(toOut(booking));
  })
);

router.get(
  "/me",
  getCurrentGuest,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);
    const rows = await query<Booking>(
      `SELECT * FROM bookings WHERE guest_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.guest!.guestId, limit, offset]
    );
    res.json(rows.map(toOut));
  })
);

router.post(
  "/:bookingId/confirm-stub",
  validateBody(ConfirmPaymentInSchema),
  asyncHandler(async (req, res) => {
    // Temporary stand-in for the Razorpay webhook. Flips pending_payment -> confirmed.
    // Replace with real webhook signature verification when Razorpay sandbox keys are wired up.
    // Gated by payments_stub_mode so a deploy can't accidentally fake a payment once a
    // real gateway is configured — flip that setting to false when wiring in Razorpay.
    if (!settings.paymentsStubMode) throw new HttpError(501, "Payment confirmation is not implemented");
    const booking = await confirmStubPayment(parseInt(req.params.bookingId, 10), req.body.email);
    res.json(toOut(booking));
  })
);

router.patch(
  "/:bookingId/cancel",
  validateBody(BookingCancelInSchema),
  asyncHandler(async (req, res) => {
    const booking = await cancelOwnBooking(parseInt(req.params.bookingId, 10), req.body.email);
    res.json(toOut(booking));
  })
);

router.get(
  "/:bookingId",
  asyncHandler(async (req, res) => {
    const bookingId = parseInt(req.params.bookingId, 10);
    const email = String(req.query.email ?? "");
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(422, "Invalid email format");
    }

    const booking = await queryOne<Booking>("SELECT * FROM bookings WHERE id = $1", [bookingId]);
    if (!booking) throw new HttpError(404, "Booking not found");
    const guest = booking.guest_id ? await queryOne<Guest>("SELECT * FROM guests WHERE id = $1", [booking.guest_id]) : null;
    if (!guest || guest.email.toLowerCase() !== email.toLowerCase()) throw new HttpError(404, "Booking not found");
    res.json(toOut(booking));
  })
);
