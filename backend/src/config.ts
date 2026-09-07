import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw.trim().toLowerCase() === "true" || raw.trim() === "1";
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const settings = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtAlgorithm: (process.env.JWT_ALGORITHM || "HS256") as "HS256",
  jwtExpireMinutes: int("JWT_EXPIRE_MINUTES", 60 * 12),
  corsOrigins: process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001",
  pendingPaymentExpiryMinutes: int("PENDING_PAYMENT_EXPIRY_MINUTES", 15),
  // Cookies require Secure to be sent over HTTPS; browsers make an exception for
  // http://localhost, so this can stay true in local dev too. Set false only for
  // a non-localhost, non-HTTPS deployment.
  cookieSecure: bool("COOKIE_SECURE", true),
  // No Razorpay (or other gateway) keys are wired up yet — these stub endpoints
  // fake a successful payment/refund. Must be false before real money moves.
  paymentsStubMode: bool("PAYMENTS_STUB_MODE", true),
  port: int("PORT", 8000),

  get corsOriginList(): string[] {
    return this.corsOrigins.split(",").map((o) => o.trim()).filter(Boolean);
  },
};
