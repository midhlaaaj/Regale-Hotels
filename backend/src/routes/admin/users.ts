import { Router } from "express";
import { query, queryOne } from "../../db";
import { asyncHandler, HttpError } from "../../middleware/errors";
import { validateBody } from "../../middleware/validate";
import { AdminUserCreateSchema } from "../../schemas/admin";
import { hashPassword, requireSuperAdmin } from "../../security";
import { UserRole } from "../../types/enums";
import { User } from "../../types/models";

export const router = Router();

router.use(requireSuperAdmin);

router.get(
  "",
  asyncHandler(async (_req, res) => {
    const rows = await query<User>("SELECT * FROM users ORDER BY created_at");
    res.json(
      rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        property_id: u.property_id,
        is_active: u.is_active,
      }))
    );
  })
);

router.post(
  "",
  validateBody(AdminUserCreateSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as { name: string; email: string; password: string; role: UserRole; property_id: number | null };
    if (payload.role === UserRole.property_manager && payload.property_id === null) {
      throw new HttpError(400, "property_manager accounts must have a property_id");
    }
    if (payload.role === UserRole.super_admin && payload.property_id !== null) {
      throw new HttpError(400, "super_admin accounts must not have a property_id");
    }
    if (payload.property_id !== null) {
      const property = await queryOne("SELECT id FROM properties WHERE id = $1", [payload.property_id]);
      if (!property) throw new HttpError(404, "Property not found");
    }
    const existing = await queryOne("SELECT id FROM users WHERE email = $1", [payload.email]);
    if (existing) throw new HttpError(409, "An account with this email already exists");

    const user = await queryOne<User>(
      `INSERT INTO users (name, email, password_hash, role, property_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [payload.name, payload.email, hashPassword(payload.password), payload.role, payload.property_id]
    );
    res.json({ id: user!.id, name: user!.name, email: user!.email, role: user!.role });
  })
);

router.patch(
  "/:userId/deactivate",
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (userId === req.admin!.userId) throw new HttpError(400, "You cannot deactivate your own account");
    const user = await queryOne<User>("SELECT * FROM users WHERE id = $1", [userId]);
    if (!user) throw new HttpError(404, "User not found");
    const updated = await queryOne<User>("UPDATE users SET is_active = false WHERE id = $1 RETURNING *", [userId]);
    res.json({ id: updated!.id, is_active: updated!.is_active });
  })
);

router.patch(
  "/:userId/reactivate",
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const user = await queryOne<User>("SELECT * FROM users WHERE id = $1", [userId]);
    if (!user) throw new HttpError(404, "User not found");
    const updated = await queryOne<User>("UPDATE users SET is_active = true WHERE id = $1 RETURNING *", [userId]);
    res.json({ id: updated!.id, is_active: updated!.is_active });
  })
);
