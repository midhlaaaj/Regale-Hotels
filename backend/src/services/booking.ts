import { PoolClient } from "pg";
import { settings } from "../config";
import { withTransaction } from "../db";
import { HttpError } from "../middleware/errors";
import { AdminBookingCreate } from "../schemas/adminContent";
import { BookingCreate, GuestIn } from "../schemas/public";
import { BookingSource, BookingStatus, GuestVerificationStatus, PaymentGateway, PaymentStatus } from "../types/enums";
import { Booking, Guest, Property, RatePlan, RoomType } from "../types/models";

// Statuses that count as "holding" a room for a given night.
const HOLDING_STATUSES = [BookingStatus.confirmed, BookingStatus.pending_payment];
// A guest can cancel a booking themselves as long as it's still in one of these
// states and their stay hasn't already started.
const CANCELLABLE_STATUSES = [BookingStatus.pending_payment, BookingStatus.confirmed, BookingStatus.pending_whatsapp];
const MAX_STAY_NIGHTS = 30;
const MAX_ADVANCE_BOOKING_DAYS = 730; // 2 years — keeps the availability loop bounded

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / msPerDay);
}

function nightsBetween(checkIn: string, checkOut: string): string[] {
  const count = daysBetween(checkIn, checkOut);
  const nights: string[] = [];
  for (let i = 0; i < count; i++) nights.push(addDays(checkIn, i));
  return nights;
}

async function heldCount(client: PoolClient, roomTypeId: number, day: string): Promise<number> {
  const expiryCutoff = new Date(Date.now() - settings.pendingPaymentExpiryMinutes * 60_000);
  const rows = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM bookings
     WHERE room_type_id = $1
       AND check_in <= $2
       AND check_out > $2
       AND status = ANY($3::text[])
       AND NOT (status = $4 AND created_at < $5)`,
    [roomTypeId, day, HOLDING_STATUSES, BookingStatus.pending_payment, expiryCutoff]
  );
  return parseInt(rows.rows[0].count, 10);
}

interface ValidatedBookingInputs {
  property: Property;
  roomType: RoomType;
  ratePlan: RatePlan;
  nights: string[];
}

async function validateAndLock(
  client: PoolClient,
  params: {
    propertyId: number;
    roomTypeId: number;
    ratePlanId: number;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
    enforceCapacity: boolean;
  }
): Promise<ValidatedBookingInputs> {
  const { propertyId, roomTypeId, ratePlanId, checkIn, checkOut, guestsCount, enforceCapacity } = params;

  if (checkIn >= checkOut) throw new HttpError(400, "check_out must be after check_in");
  const today = todayDateString();
  if (checkIn < today) throw new HttpError(400, "check_in cannot be in the past");
  if (daysBetween(checkIn, checkOut) > MAX_STAY_NIGHTS) {
    throw new HttpError(400, `Stays longer than ${MAX_STAY_NIGHTS} nights aren't supported`);
  }
  if (daysBetween(today, checkIn) > MAX_ADVANCE_BOOKING_DAYS) {
    throw new HttpError(400, "Check-in date is too far in the future");
  }

  const roomTypeRes = await client.query<RoomType>("SELECT * FROM room_types WHERE id = $1", [roomTypeId]);
  const ratePlanRes = await client.query<RatePlan>("SELECT * FROM rate_plans WHERE id = $1", [ratePlanId]);
  const propertyRes = await client.query<Property>("SELECT * FROM properties WHERE id = $1", [propertyId]);
  const roomType = roomTypeRes.rows[0];
  const ratePlan = ratePlanRes.rows[0];
  const property = propertyRes.rows[0];
  if (!roomType || !ratePlan || !property) {
    throw new HttpError(404, "Property, room type, or rate plan not found");
  }
  if (ratePlan.room_type_id !== roomType.id || roomType.property_id !== property.id) {
    throw new HttpError(400, "Room/rate plan does not belong to this property");
  }
  if (guestsCount > roomType.max_occupancy) {
    throw new HttpError(400, "Guest count exceeds room's max occupancy");
  }
  if (!(ratePlan.valid_from <= checkIn && checkOut <= ratePlan.valid_to)) {
    throw new HttpError(400, "Dates fall outside this rate plan's validity window");
  }

  const nights = nightsBetween(checkIn, checkOut);

  // Lock the relevant availability rows so concurrent bookings for the same
  // room/date range serialize instead of both reading a stale remaining count.
  const lockRes = await client.query<{ date: string; rooms_available: number }>(
    `SELECT date, rooms_available FROM availability
     WHERE room_type_id = $1 AND date = ANY($2::date[])
     FOR UPDATE`,
    [roomType.id, nights]
  );
  const availabilityByDate = new Map(lockRes.rows.map((r) => [r.date, r.rooms_available]));

  for (const day of nights) {
    const capacity = availabilityByDate.get(day) ?? 0;
    const held = await heldCount(client, roomType.id, day);
    if (enforceCapacity && capacity - held < 1) {
      throw new HttpError(409, `No rooms available on ${day}`);
    }
  }

  return { property, roomType, ratePlan, nights };
}

async function upsertGuest(client: PoolClient, guestIn: GuestIn): Promise<Guest> {
  const existingRes = await client.query<Guest>("SELECT * FROM guests WHERE email = $1", [guestIn.email]);
  let guest = existingRes.rows[0];

  if (!guest) {
    const verificationStatus = guestIn.id_document_url ? GuestVerificationStatus.pending : GuestVerificationStatus.unverified;
    const inserted = await client.query<Guest>(
      `INSERT INTO guests (name, email, phone, id_document_url, verification_status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [guestIn.name, guestIn.email, guestIn.phone, guestIn.id_document_url ?? null, verificationStatus]
    );
    guest = inserted.rows[0];
  } else if (guestIn.id_document_url && guestIn.id_document_url !== guest.id_document_url) {
    // A newly submitted document supersedes any prior review — including a
    // past rejection — and needs to be looked at again.
    const newStatus =
      guest.verification_status !== GuestVerificationStatus.verified ? GuestVerificationStatus.pending : guest.verification_status;
    const updated = await client.query<Guest>(
      `UPDATE guests SET id_document_url = $1, verification_status = $2 WHERE id = $3 RETURNING *`,
      [guestIn.id_document_url, newStatus, guest.id]
    );
    guest = updated.rows[0];
  }
  return guest;
}

export async function createBooking(payload: BookingCreate): Promise<Booking> {
  return withTransaction(async (client) => {
    const { property, roomType, ratePlan, nights } = await validateAndLock(client, {
      propertyId: payload.property_id,
      roomTypeId: payload.room_type_id,
      ratePlanId: payload.rate_plan_id,
      checkIn: payload.check_in,
      checkOut: payload.check_out,
      guestsCount: payload.guests_count,
      enforceCapacity: payload.payment_method === BookingSource.online,
    });
    const guest = await upsertGuest(client, payload.guest);

    const totalAmount = ratePlan.fixed_price * nights.length;
    const status = payload.payment_method === BookingSource.online ? BookingStatus.pending_payment : BookingStatus.pending_whatsapp;

    const bookingRes = await client.query<Booking>(
      `INSERT INTO bookings (property_id, room_type_id, rate_plan_id, guest_id, check_in, check_out, guests_count, status, source, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        property.id,
        roomType.id,
        ratePlan.id,
        guest.id,
        payload.check_in,
        payload.check_out,
        payload.guests_count,
        status,
        payload.payment_method,
        totalAmount,
      ]
    );
    const booking = bookingRes.rows[0];

    if (payload.payment_method === BookingSource.online) {
      await client.query(
        `INSERT INTO payments (booking_id, gateway, amount, status) VALUES ($1,$2,$3,$4)`,
        [booking.id, PaymentGateway.stub, totalAmount, PaymentStatus.pending]
      );
    }

    return booking;
  });
}

/** Staff-entered booking for a walk-in or phone reservation — payment is
 * handled outside the system (cash/card at the desk), so it's created
 * already confirmed and always counts against real availability. */
export async function createManualBooking(propertyId: number | null, payload: AdminBookingCreate): Promise<Booking> {
  if (propertyId === null) throw new HttpError(400, "property_id is required");
  return withTransaction(async (client) => {
    const { property, roomType, ratePlan, nights } = await validateAndLock(client, {
      propertyId,
      roomTypeId: payload.room_type_id,
      ratePlanId: payload.rate_plan_id,
      checkIn: payload.check_in,
      checkOut: payload.check_out,
      guestsCount: payload.guests_count,
      enforceCapacity: true,
    });
    const guest = await upsertGuest(client, payload.guest);

    const totalAmount = ratePlan.fixed_price * nights.length;
    const bookingRes = await client.query<Booking>(
      `INSERT INTO bookings (property_id, room_type_id, rate_plan_id, guest_id, check_in, check_out, guests_count, status, source, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        property.id,
        roomType.id,
        ratePlan.id,
        guest.id,
        payload.check_in,
        payload.check_out,
        payload.guests_count,
        BookingStatus.confirmed,
        BookingSource.manual,
        totalAmount,
      ]
    );
    return bookingRes.rows[0];
  });
}

/** Stub stand-in for the Razorpay webhook. Booking ids are sequential and
 * guessable, so this still checks the requester knows the guest's email —
 * the same ownership proof GET /api/bookings/{id} requires — otherwise
 * anyone could "pay" for anyone else's pending booking. */
export async function confirmStubPayment(bookingId: number, email: string): Promise<Booking> {
  return withTransaction(async (client) => {
    const bookingRes = await client.query<Booking>("SELECT * FROM bookings WHERE id = $1", [bookingId]);
    const booking = bookingRes.rows[0];
    if (!booking) throw new HttpError(404, "Booking not found");
    const guest = booking.guest_id ? (await client.query<Guest>("SELECT * FROM guests WHERE id = $1", [booking.guest_id])).rows[0] : null;
    if (!guest || guest.email.toLowerCase() !== email.toLowerCase()) throw new HttpError(404, "Booking not found");
    if (booking.status !== BookingStatus.pending_payment) throw new HttpError(400, "Booking is not awaiting payment");

    const updated = await client.query<Booking>(
      `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [BookingStatus.confirmed, bookingId]
    );
    await client.query(`UPDATE payments SET status = $1 WHERE booking_id = $2`, [PaymentStatus.succeeded, bookingId]);
    return updated.rows[0];
  });
}

/** Guest self-service cancel — same email-ownership proof as confirmStubPayment
 * and GET /api/bookings/{id}, since booking ids are sequential and guessable. */
export async function cancelOwnBooking(bookingId: number, email: string): Promise<Booking> {
  return withTransaction(async (client) => {
    const bookingRes = await client.query<Booking>("SELECT * FROM bookings WHERE id = $1", [bookingId]);
    const booking = bookingRes.rows[0];
    if (!booking) throw new HttpError(404, "Booking not found");
    const guest = booking.guest_id ? (await client.query<Guest>("SELECT * FROM guests WHERE id = $1", [booking.guest_id])).rows[0] : null;
    if (!guest || guest.email.toLowerCase() !== email.toLowerCase()) throw new HttpError(404, "Booking not found");
    if (!CANCELLABLE_STATUSES.includes(booking.status)) throw new HttpError(400, "This booking can no longer be cancelled");
    if (booking.check_in <= todayDateString()) throw new HttpError(400, "This booking's stay has already started");

    const updated = await client.query<Booking>(
      `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [BookingStatus.cancelled, bookingId]
    );
    return updated.rows[0];
  });
}
