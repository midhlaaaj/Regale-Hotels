import { Router } from "express";
import { query } from "../../db";
import { asyncHandler, HttpError } from "../../middleware/errors";
import { requireSuperAdmin } from "../../security";
import { BookingStatus } from "../../types/enums";

export const router = Router();

router.use(requireSuperAdmin);

router.get(
  "",
  asyncHandler(async (req, res) => {
    const type = String(req.query.type ?? "revenue");
    if (!["revenue", "source", "status"].includes(type)) throw new HttpError(422, "Invalid report type");

    let rows: { key: unknown; value: unknown }[];
    if (type === "revenue") {
      rows = await query(
        `SELECT property_id AS key, SUM(total_amount) AS value FROM bookings WHERE status = $1 GROUP BY property_id`,
        [BookingStatus.confirmed]
      );
    } else if (type === "source") {
      rows = await query(`SELECT source AS key, COUNT(*) AS value FROM bookings GROUP BY source`);
    } else {
      rows = await query(`SELECT status AS key, COUNT(*) AS value FROM bookings GROUP BY status`);
    }

    res.json(rows.map((row) => ({ key: String(row.key), value: typeof row.value === "string" ? parseInt(row.value, 10) : row.value })));
  })
);
