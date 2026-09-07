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

/** Builds the API app. Deployed as its own standalone Vercel project (no
 * shared-domain rewrite prefix), so routes are mounted at their plain paths
 * and hit directly at this service's own origin. */
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
