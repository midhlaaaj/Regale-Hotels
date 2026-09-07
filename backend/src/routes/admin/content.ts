import { Router } from "express";
import { query, queryOne } from "../../db";
import { asyncHandler, HttpError } from "../../middleware/errors";
import { validateBody } from "../../middleware/validate";
import { AboutContentInSchema, HeroContentInSchema } from "../../schemas/adminContent";
import { requireSuperAdmin } from "../../security";
import { SiteContent, Testimonial } from "../../types/models";

export const router = Router();

router.use(requireSuperAdmin);

router.get(
  "/testimonials",
  asyncHandler(async (_req, res) => {
    const rows = await query<Testimonial>("SELECT * FROM testimonials");
    res.json(rows);
  })
);

router.post(
  "/testimonials/:testimonialId/approve",
  asyncHandler(async (req, res) => {
    const testimonialId = parseInt(req.params.testimonialId, 10);
    const existing = await queryOne<Testimonial>("SELECT * FROM testimonials WHERE id = $1", [testimonialId]);
    if (!existing) throw new HttpError(404, "Testimonial not found");
    const updated = await queryOne<Testimonial>("UPDATE testimonials SET approved = true WHERE id = $1 RETURNING *", [testimonialId]);
    res.json(updated);
  })
);

function excludeNone<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));
}

async function upsertContent(key: string, value: Record<string, unknown>): Promise<SiteContent> {
  const existing = await queryOne<SiteContent>("SELECT * FROM site_content WHERE key = $1", [key]);
  if (!existing) {
    return (await queryOne<SiteContent>(
      "INSERT INTO site_content (key, value) VALUES ($1, $2) RETURNING *",
      [key, JSON.stringify(value)]
    ))!;
  }
  return (await queryOne<SiteContent>(
    "UPDATE site_content SET value = $1, updated_at = now() WHERE key = $2 RETURNING *",
    [JSON.stringify(value), key]
  ))!;
}

router.post(
  "/content/hero",
  validateBody(HeroContentInSchema),
  asyncHandler(async (req, res) => {
    const content = await upsertContent("hero", excludeNone(req.body));
    res.json(content);
  })
);

router.post(
  "/content/about",
  validateBody(AboutContentInSchema),
  asyncHandler(async (req, res) => {
    const content = await upsertContent("about", excludeNone(req.body));
    res.json(content);
  })
);
