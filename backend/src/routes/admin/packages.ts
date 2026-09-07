import { Router } from "express";
import { query, queryOne } from "../../db";
import { asyncHandler, HttpError } from "../../middleware/errors";
import { validateBody } from "../../middleware/validate";
import { PackageCreateSchema, PackageUpdateSchema } from "../../schemas/adminContent";
import { requireSuperAdmin } from "../../security";
import { Package } from "../../types/models";

export const router = Router();

router.use(requireSuperAdmin);

router.get(
  "",
  asyncHandler(async (_req, res) => {
    const rows = await query<Package>("SELECT * FROM packages ORDER BY created_at DESC");
    res.json(rows);
  })
);

router.post(
  "",
  validateBody(PackageCreateSchema),
  asyncHandler(async (req, res) => {
    const p = req.body as {
      property_id: number;
      name: string;
      nights: number;
      description: string;
      price: number;
      meal_plan: string;
      rooms_included: number;
      max_guests: number;
      cover_image_url: string | null;
      active: boolean;
    };
    const property = await queryOne("SELECT id FROM properties WHERE id = $1", [p.property_id]);
    if (!property) throw new HttpError(404, "Property not found");

    const created = await queryOne<Package>(
      `INSERT INTO packages (property_id, name, nights, description, price, meal_plan, rooms_included, max_guests, cover_image_url, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [p.property_id, p.name, p.nights, p.description, p.price, p.meal_plan, p.rooms_included, p.max_guests, p.cover_image_url, p.active]
    );
    res.json(created);
  })
);

router.patch(
  "/:packageId",
  validateBody(PackageUpdateSchema),
  asyncHandler(async (req, res) => {
    const packageId = parseInt(req.params.packageId, 10);
    const existing = await queryOne<Package>("SELECT * FROM packages WHERE id = $1", [packageId]);
    if (!existing) throw new HttpError(404, "Package not found");

    const updates = req.body as Partial<Package>;
    const merged: Package = { ...existing, ...updates };
    const updated = await queryOne<Package>(
      `UPDATE packages SET name=$1, nights=$2, description=$3, price=$4, meal_plan=$5, rooms_included=$6,
       max_guests=$7, cover_image_url=$8, active=$9, updated_at=now() WHERE id=$10 RETURNING *`,
      [
        merged.name,
        merged.nights,
        merged.description,
        merged.price,
        merged.meal_plan,
        merged.rooms_included,
        merged.max_guests,
        merged.cover_image_url,
        merged.active,
        packageId,
      ]
    );
    res.json(updated);
  })
);

router.delete(
  "/:packageId",
  asyncHandler(async (req, res) => {
    const packageId = parseInt(req.params.packageId, 10);
    const existing = await queryOne<Package>("SELECT * FROM packages WHERE id = $1", [packageId]);
    if (!existing) throw new HttpError(404, "Package not found");
    await query("DELETE FROM packages WHERE id = $1", [packageId]);
    res.status(204).send();
  })
);
