import { Router } from "express";
import { query, queryOne, withTransaction } from "../../db";
import { asyncHandler, HttpError } from "../../middleware/errors";
import { validateBody } from "../../middleware/validate";
import {
  AvailabilityBulkUpsertSchema,
  PropertyCreateSchema,
  PropertyUpdateSchema,
  RatePlanCreateSchema,
  RatePlanUpdateSchema,
  RoomTypeCreateSchema,
  RoomTypeUpdateSchema,
} from "../../schemas/adminContent";
import { requireSuperAdmin } from "../../security";
import { Availability, Property, RatePlan, RoomType } from "../../types/models";

export const router = Router();

const MAX_AVAILABILITY_RANGE_DAYS = 120;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);
}

async function assertNoBookings(column: "property_id" | "room_type_id" | "rate_plan_id", value: number, what: string): Promise<void> {
  const existing = await queryOne(`SELECT id FROM bookings WHERE ${column} = $1 LIMIT 1`, [value]);
  if (existing) throw new HttpError(409, `Cannot delete a ${what} with existing bookings`);
}

function cleanAmenities(amenities: string[]): string[] {
  const cleaned = amenities.map((a) => a.trim().slice(0, 60)).filter((a) => a.length > 0);
  if (cleaned.length !== amenities.length) throw new HttpError(422, "Amenity labels cannot be blank");
  return cleaned;
}

router.use(requireSuperAdmin);

router.get(
  "/properties",
  asyncHandler(async (_req, res) => {
    const rows = await query<Property>("SELECT * FROM properties ORDER BY id");
    res.json(rows);
  })
);

router.post(
  "/properties",
  validateBody(PropertyCreateSchema),
  asyncHandler(async (req, res) => {
    const p = req.body as {
      name: string;
      slug: string;
      city: string;
      state: string;
      description: string;
      cover_image_url: string;
      latitude: number | null;
      longitude: number | null;
      amenities: string[];
    };
    const existing = await queryOne("SELECT id FROM properties WHERE slug = $1", [p.slug]);
    if (existing) throw new HttpError(409, "A property with this slug already exists");

    const amenities = cleanAmenities(p.amenities);
    const created = await queryOne<Property>(
      `INSERT INTO properties (name, slug, city, state, description, cover_image_url, latitude, longitude, amenities)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [p.name, p.slug, p.city, p.state, p.description, p.cover_image_url, p.latitude, p.longitude, JSON.stringify(amenities)]
    );
    res.json(created);
  })
);

router.patch(
  "/properties/:propertyId",
  validateBody(PropertyUpdateSchema),
  asyncHandler(async (req, res) => {
    const propertyId = parseInt(req.params.propertyId, 10);
    const existing = await queryOne<Property>("SELECT * FROM properties WHERE id = $1", [propertyId]);
    if (!existing) throw new HttpError(404, "Property not found");

    const updates = req.body as Partial<Property>;
    if (updates.slug !== undefined && updates.slug !== existing.slug) {
      const clash = await queryOne("SELECT id FROM properties WHERE slug = $1", [updates.slug]);
      if (clash) throw new HttpError(409, "A property with this slug already exists");
    }
    const amenities = updates.amenities !== undefined ? cleanAmenities(updates.amenities) : existing.amenities;
    const merged = { ...existing, ...updates, amenities };

    const updated = await queryOne<Property>(
      `UPDATE properties SET name=$1, slug=$2, city=$3, state=$4, description=$5, cover_image_url=$6,
       latitude=$7, longitude=$8, amenities=$9, updated_at=now() WHERE id=$10 RETURNING *`,
      [
        merged.name,
        merged.slug,
        merged.city,
        merged.state,
        merged.description,
        merged.cover_image_url,
        merged.latitude,
        merged.longitude,
        JSON.stringify(merged.amenities),
        propertyId,
      ]
    );
    res.json(updated);
  })
);

router.post(
  "/room-types",
  validateBody(RoomTypeCreateSchema),
  asyncHandler(async (req, res) => {
    const p = req.body as { property_id: number; name: string; description: string; max_occupancy: number; base_price: number; images: string[] };
    const property = await queryOne("SELECT id FROM properties WHERE id = $1", [p.property_id]);
    if (!property) throw new HttpError(404, "Property not found");
    const created = await queryOne<RoomType>(
      `INSERT INTO room_types (property_id, name, description, max_occupancy, base_price, images)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [p.property_id, p.name, p.description, p.max_occupancy, p.base_price, JSON.stringify(p.images)]
    );
    res.json(created);
  })
);

router.patch(
  "/room-types/:roomTypeId",
  validateBody(RoomTypeUpdateSchema),
  asyncHandler(async (req, res) => {
    const roomTypeId = parseInt(req.params.roomTypeId, 10);
    const existing = await queryOne<RoomType>("SELECT * FROM room_types WHERE id = $1", [roomTypeId]);
    if (!existing) throw new HttpError(404, "Room type not found");
    const updates = req.body as Partial<RoomType>;
    const merged = { ...existing, ...updates };
    const updated = await queryOne<RoomType>(
      `UPDATE room_types SET name=$1, description=$2, max_occupancy=$3, base_price=$4, images=$5, updated_at=now() WHERE id=$6 RETURNING *`,
      [merged.name, merged.description, merged.max_occupancy, merged.base_price, JSON.stringify(merged.images), roomTypeId]
    );
    res.json(updated);
  })
);

router.post(
  "/rate-plans",
  validateBody(RatePlanCreateSchema),
  asyncHandler(async (req, res) => {
    const p = req.body as {
      room_type_id: number;
      name: string;
      fixed_price: number;
      refundable: boolean;
      includes_breakfast: boolean;
      valid_from: string;
      valid_to: string;
    };
    const roomType = await queryOne("SELECT id FROM room_types WHERE id = $1", [p.room_type_id]);
    if (!roomType) throw new HttpError(404, "Room type not found");
    const created = await queryOne<RatePlan>(
      `INSERT INTO rate_plans (room_type_id, name, fixed_price, refundable, includes_breakfast, valid_from, valid_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [p.room_type_id, p.name, p.fixed_price, p.refundable, p.includes_breakfast, p.valid_from, p.valid_to]
    );
    res.json(created);
  })
);

router.patch(
  "/rate-plans/:ratePlanId",
  validateBody(RatePlanUpdateSchema),
  asyncHandler(async (req, res) => {
    const ratePlanId = parseInt(req.params.ratePlanId, 10);
    const existing = await queryOne<RatePlan>("SELECT * FROM rate_plans WHERE id = $1", [ratePlanId]);
    if (!existing) throw new HttpError(404, "Rate plan not found");
    const updates = req.body as Partial<RatePlan>;
    const validFrom = updates.valid_from ?? existing.valid_from;
    const validTo = updates.valid_to ?? existing.valid_to;
    if (validTo <= validFrom) throw new HttpError(400, "valid_to must be after valid_from");
    const merged = { ...existing, ...updates };
    const updated = await queryOne<RatePlan>(
      `UPDATE rate_plans SET name=$1, fixed_price=$2, refundable=$3, includes_breakfast=$4, valid_from=$5, valid_to=$6 WHERE id=$7 RETURNING *`,
      [merged.name, merged.fixed_price, merged.refundable, merged.includes_breakfast, merged.valid_from, merged.valid_to, ratePlanId]
    );
    res.json(updated);
  })
);

router.delete(
  "/rate-plans/:ratePlanId",
  asyncHandler(async (req, res) => {
    const ratePlanId = parseInt(req.params.ratePlanId, 10);
    const existing = await queryOne<RatePlan>("SELECT * FROM rate_plans WHERE id = $1", [ratePlanId]);
    if (!existing) throw new HttpError(404, "Rate plan not found");
    await assertNoBookings("rate_plan_id", ratePlanId, "rate plan");
    await query("DELETE FROM rate_plans WHERE id = $1", [ratePlanId]);
    res.status(204).send();
  })
);

router.delete(
  "/room-types/:roomTypeId",
  asyncHandler(async (req, res) => {
    const roomTypeId = parseInt(req.params.roomTypeId, 10);
    const existing = await queryOne<RoomType>("SELECT * FROM room_types WHERE id = $1", [roomTypeId]);
    if (!existing) throw new HttpError(404, "Room type not found");
    await assertNoBookings("room_type_id", roomTypeId, "room type");
    await withTransaction(async (client) => {
      await client.query("DELETE FROM rate_plans WHERE room_type_id = $1", [roomTypeId]);
      await client.query("DELETE FROM availability WHERE room_type_id = $1", [roomTypeId]);
      await client.query("DELETE FROM room_types WHERE id = $1", [roomTypeId]);
    });
    res.status(204).send();
  })
);

router.delete(
  "/properties/:propertyId",
  asyncHandler(async (req, res) => {
    const propertyId = parseInt(req.params.propertyId, 10);
    const existing = await queryOne<Property>("SELECT * FROM properties WHERE id = $1", [propertyId]);
    if (!existing) throw new HttpError(404, "Property not found");
    await assertNoBookings("property_id", propertyId, "property");

    await withTransaction(async (client) => {
      const roomTypeIdsRes = await client.query<{ id: number }>("SELECT id FROM room_types WHERE property_id = $1", [propertyId]);
      const roomTypeIds = roomTypeIdsRes.rows.map((r) => r.id);
      if (roomTypeIds.length) {
        await client.query("DELETE FROM rate_plans WHERE room_type_id = ANY($1::int[])", [roomTypeIds]);
        await client.query("DELETE FROM availability WHERE room_type_id = ANY($1::int[])", [roomTypeIds]);
      }
      await client.query("DELETE FROM room_types WHERE property_id = $1", [propertyId]);
      await client.query("DELETE FROM properties WHERE id = $1", [propertyId]);
    });
    res.status(204).send();
  })
);

router.get(
  "/room-types/:roomTypeId/availability",
  asyncHandler(async (req, res) => {
    const roomTypeId = parseInt(req.params.roomTypeId, 10);
    const dateFrom = String(req.query.date_from ?? "");
    const dateTo = String(req.query.date_to ?? "");
    if (!(await queryOne("SELECT id FROM room_types WHERE id = $1", [roomTypeId]))) throw new HttpError(404, "Room type not found");
    if (dateFrom >= dateTo) throw new HttpError(400, "date_to must be after date_from");
    if (daysBetween(dateFrom, dateTo) > MAX_AVAILABILITY_RANGE_DAYS) {
      throw new HttpError(400, `Range cannot exceed ${MAX_AVAILABILITY_RANGE_DAYS} days`);
    }

    const days: string[] = [];
    for (let i = 0; i < daysBetween(dateFrom, dateTo); i++) days.push(addDays(dateFrom, i));

    const rows = await query<Availability>("SELECT * FROM availability WHERE room_type_id = $1 AND date = ANY($2::date[])", [
      roomTypeId,
      days,
    ]);
    const byDate = new Map(rows.map((r) => [r.date, r.rooms_available]));
    res.json(days.map((d) => ({ date: d, rooms_available: byDate.get(d) ?? 0 })));
  })
);

router.put(
  "/room-types/:roomTypeId/availability",
  validateBody(AvailabilityBulkUpsertSchema),
  asyncHandler(async (req, res) => {
    const roomTypeId = parseInt(req.params.roomTypeId, 10);
    if (!(await queryOne("SELECT id FROM room_types WHERE id = $1", [roomTypeId]))) throw new HttpError(404, "Room type not found");

    const days = req.body.days as { date: string; rooms_available: number }[];
    await withTransaction(async (client) => {
      for (const day of days) {
        await client.query(
          `INSERT INTO availability (room_type_id, date, rooms_available) VALUES ($1,$2,$3)
           ON CONFLICT (room_type_id, date) DO UPDATE SET rooms_available = EXCLUDED.rooms_available`,
          [roomTypeId, day.date, day.rooms_available]
        );
      }
    });
    res.json({ updated: days.length });
  })
);
