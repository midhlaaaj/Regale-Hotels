import { Router } from "express";
import { queryOne } from "../../db";
import { asyncHandler } from "../../middleware/errors";
import { getCurrentAdmin, scopePropertyId } from "../../security";
import { BookingStatus } from "../../types/enums";

export const router = Router();

router.use(getCurrentAdmin);

router.get(
  "",
  asyncHandler(async (req, res) => {
    const scopedProperty = scopePropertyId(
      req.query.property !== undefined ? parseInt(String(req.query.property), 10) : null,
      req.admin!
    );

    const propertyFilter = scopedProperty !== null ? "AND property_id = $1" : "";
    const params = scopedProperty !== null ? [scopedProperty] : [];

    const todays = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM bookings
       WHERE check_in <= CURRENT_DATE AND check_out > CURRENT_DATE AND status = $${params.length + 1} ${propertyFilter}`,
      [...params, BookingStatus.confirmed]
    );
    const pendingWhatsapp = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM bookings WHERE status = $${params.length + 1} ${propertyFilter}`,
      [...params, BookingStatus.pending_whatsapp]
    );
    const revenue = await queryOne<{ sum: number }>(
      `SELECT COALESCE(SUM(total_amount), 0) AS sum FROM bookings WHERE status = $${params.length + 1} ${propertyFilter}`,
      [...params, BookingStatus.confirmed]
    );

    res.json({
      todays_bookings_count: parseInt(todays!.count, 10),
      pending_whatsapp_count: parseInt(pendingWhatsapp!.count, 10),
      confirmed_revenue: revenue!.sum,
      scoped_property_id: scopedProperty,
    });
  })
);
