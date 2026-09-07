import { Router } from "express";
import { query } from "../db";
import { asyncHandler } from "../middleware/errors";
import { Testimonial } from "../types/models";

export const router = Router();

router.get(
  "",
  asyncHandler(async (req, res) => {
    const property = req.query.property !== undefined ? parseInt(String(req.query.property), 10) : undefined;
    const params: unknown[] = [];
    let sql = "SELECT * FROM testimonials WHERE approved = true";
    if (property !== undefined && !Number.isNaN(property)) {
      params.push(property);
      sql += ` AND property_id = $${params.length}`;
    }
    const rows = await query<Testimonial>(sql, params);
    res.json(rows);
  })
);
