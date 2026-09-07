import { Router } from "express";
import { queryOne } from "../db";
import { asyncHandler, HttpError } from "../middleware/errors";
import { SiteContent } from "../types/models";

export const router = Router();

const KEY_RE = /^[a-z_]+$/;

router.get(
  "/:key",
  asyncHandler(async (req, res) => {
    const key = req.params.key;
    if (key.length < 1 || key.length > 50 || !KEY_RE.test(key)) throw new HttpError(422, "Invalid content key");
    const content = await queryOne<SiteContent>("SELECT * FROM site_content WHERE key = $1", [key]);
    res.json(content ? content.value : {});
  })
);
