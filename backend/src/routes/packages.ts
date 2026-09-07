import { Router } from "express";
import { query } from "../db";
import { asyncHandler } from "../middleware/errors";
import { Package, Property } from "../types/models";

export const router = Router();

router.get(
  "",
  asyncHandler(async (req, res) => {
    const property = req.query.property !== undefined ? parseInt(String(req.query.property), 10) : undefined;
    const params: unknown[] = [];
    let sql = `SELECT pkg.*, p.name AS property_name, p.slug AS property_slug, p.city AS property_city, p.cover_image_url AS property_cover_image_url
               FROM packages pkg JOIN properties p ON pkg.property_id = p.id
               WHERE pkg.active = true`;
    if (property !== undefined && !Number.isNaN(property)) {
      params.push(property);
      sql += ` AND pkg.property_id = $${params.length}`;
    }
    sql += " ORDER BY pkg.created_at DESC";

    const rows = await query<Package & { property_name: string; property_slug: string; property_city: string; property_cover_image_url: string }>(
      sql,
      params
    );
    res.json(
      rows.map((row) => {
        const { property_name, property_slug, property_city, property_cover_image_url, ...pkg } = row;
        return {
          ...pkg,
          cover_image_url: pkg.cover_image_url || property_cover_image_url,
          property_name,
          property_slug,
          property_city,
        };
      })
    );
  })
);
