import { Router } from "express";
import { query } from "../db";
import { asyncHandler, HttpError } from "../middleware/errors";
import { Property, RoomType } from "../types/models";

export const router = Router();

router.get(
  "",
  asyncHandler(async (req, res) => {
    const city = typeof req.query.city === "string" ? req.query.city.slice(0, 100) : undefined;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);

    const params: unknown[] = [];
    let sql = "SELECT * FROM properties";
    if (city) {
      params.push(city);
      sql += ` WHERE city = $${params.length}`;
    }
    params.push(limit, offset);
    sql += ` ORDER BY id LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const properties = await query<Property>(sql, params);
    if (properties.length === 0) {
      res.json([]);
      return;
    }

    const rooms = await query<RoomType>(`SELECT * FROM room_types WHERE property_id = ANY($1::int[])`, [
      properties.map((p) => p.id),
    ]);
    const roomsByProperty = new Map<number, RoomType[]>();
    for (const r of rooms) {
      const list = roomsByProperty.get(r.property_id) ?? [];
      list.push(r);
      roomsByProperty.set(r.property_id, list);
    }

    res.json(properties.map((p) => ({ ...p, room_types: roomsByProperty.get(p.id) ?? [] })));
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const properties = await query<Property>("SELECT * FROM properties WHERE slug = $1", [req.params.slug]);
    const property = properties[0];
    if (!property) throw new HttpError(404, "Property not found");

    const roomTypes = await query<RoomType>("SELECT * FROM room_types WHERE property_id = $1", [property.id]);
    res.json({ ...property, room_types: roomTypes });
  })
);
