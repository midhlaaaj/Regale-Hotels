import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import { settings } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errors";

import { router as authRouter } from "./routes/auth";
import { router as bookingsRouter } from "./routes/bookings";
import { router as contentRouter } from "./routes/content";
import { router as packagesRouter } from "./routes/packages";
import { router as propertiesRouter } from "./routes/properties";
import { router as roomTypesRouter } from "./routes/roomTypes";
import { router as testimonialsRouter } from "./routes/testimonials";

import { router as adminAuthRouter } from "./routes/admin/auth";
import { router as adminBookingsRouter } from "./routes/admin/bookings";
import { router as adminContentRouter } from "./routes/admin/content";
import { router as adminDashboardRouter } from "./routes/admin/dashboard";
import { router as adminGuestsRouter } from "./routes/admin/guests";
import { router as adminPackagesRouter } from "./routes/admin/packages";
import { router as adminPropertiesRouter } from "./routes/admin/properties";
import { router as adminReportsRouter } from "./routes/admin/reports";
import { router as adminUsersRouter } from "./routes/admin/users";

/** Builds the API app — equivalent to the single `api = FastAPI(...)` instance
 * in app/main.py before it gets dual-mounted for Vercel. */
export function createApiApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: settings.corsOriginList,
      credentials: true,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", authRouter);
  app.use("/api/properties", propertiesRouter);
  app.use("/api/room-types", roomTypesRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/testimonials", testimonialsRouter);
  app.use("/api/content", contentRouter);
  app.use("/api/packages", packagesRouter);

  app.use("/api/admin", adminAuthRouter);
  app.use("/api/admin/dashboard", adminDashboardRouter);
  app.use("/api/admin/bookings", adminBookingsRouter);
  app.use("/api/admin", adminPropertiesRouter);
  app.use("/api/admin/guests", adminGuestsRouter);
  app.use("/api/admin/reports", adminReportsRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin", adminContentRouter);
  app.use("/api/admin/packages", adminPackagesRouter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/** In production, a multi-service rewrite may forward the *full* matched path
 * (e.g. "/api/backend/health") to this service rather than stripping the
 * "/api/backend" prefix — so the same app is also mounted under that prefix,
 * mirroring the dual `app.mount("/api/backend", api)` / `app.mount("/", api)`
 * used by the old FastAPI entrypoint. Local dev (hit directly, no prefix)
 * keeps working unchanged; the "/api/backend" mount only matters in prod. */
export function createRootApp(): Express {
  const api = createApiApp();
  const root = express();
  root.use("/api/backend", api);
  root.use("/", api);
  return root;
}
