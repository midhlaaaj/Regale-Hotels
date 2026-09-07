import { Router } from "express";
import { query } from "../db";
import { asyncHandler, HttpError } from "../middleware/errors";
import { Availability, RatePlan, RoomType } from "../types/models";

export const router = Router();

const MAX_AVAILABILITY_RANGE_DAYS = 60;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);
}

router.get(
  "/:roomTypeId",
  asyncHandler(async (req, res) => {
    const roomTypeId = parseInt(req.params.roomTypeId, 10);
    const rows = await query<RoomType>("SELECT * FROM room_types WHERE id = $1", [roomTypeId]);
    const roomType = rows[0];
    if (!roomType) throw new HttpError(404, "Room type not found");
    res.json(roomType);
  })
);

router.get(
  "/:roomTypeId/availability",
  asyncHandler(async (req, res) => {
    const roomTypeId = parseInt(req.params.roomTypeId, 10);
    const checkin = String(req.query.checkin ?? "");
    const checkout = String(req.query.checkout ?? "");
    if (!DATE_RE.test(checkin) || !DATE_RE.test(checkout)) throw new HttpError(422, "Invalid date format, expected YYYY-MM-DD");
    if (checkin >= checkout) throw new HttpError(400, "checkout must be after checkin");
    if (daysBetween(checkin, checkout) > MAX_AVAILABILITY_RANGE_DAYS) {
      throw new HttpError(400, `Date range cannot exceed ${MAX_AVAILABILITY_RANGE_DAYS} days`);
    }

    const days: string[] = [];
    for (let i = 0; i < daysBetween(checkin, checkout); i++) days.push(addDays(checkin, i));

    const availRows = await query<Availability>(
      "SELECT * FROM availability WHERE room_type_id = $1 AND date = ANY($2::date[])",
      [roomTypeId, days]
    );
    const byDate = new Map(availRows.map((r) => [r.date, r.rooms_available]));

    const ratePlans = await query<RatePlan>(
      "SELECT * FROM rate_plans WHERE room_type_id = $1 AND valid_from <= $2 AND valid_to >= $3",
      [roomTypeId, checkin, checkout]
    );

    res.json({
      room_type_id: roomTypeId,
      days: days.map((d) => ({ date: d, rooms_available: byDate.get(d) ?? 0 })),
      rate_plans: ratePlans.map((r) => ({
        id: r.id,
        name: r.name,
        fixed_price: r.fixed_price,
        refundable: r.refundable,
        includes_breakfast: r.includes_breakfast,
      })),
    });
  })
);
