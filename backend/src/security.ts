import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { settings } from "./config";
import { UserRole } from "./types/enums";
import { HttpError } from "./middleware/errors";

export const SESSION_COOKIE = "admin_session";
export const CSRF_COOKIE = "admin_csrf";
export const GUEST_SESSION_COOKIE = "guest_session";
export const GUEST_CSRF_COOKIE = "guest_csrf";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW_MS = 60_000;
const loginAttempts = new Map<string, number[]>();

/** Simple in-process sliding-window limiter to slow down password brute-forcing.
 * Keyed by client IP — good enough for a single-instance deployment. */
export function enforceLoginRateLimit(req: Request, _res: Response, next: NextFunction) {
  const clientIp = req.ip || "unknown";
  const now = Date.now();
  let attempts = loginAttempts.get(clientIp) ?? [];
  attempts = attempts.filter((t) => now - t <= LOGIN_RATE_WINDOW_MS);
  if (attempts.length >= LOGIN_RATE_LIMIT) {
    next(new HttpError(429, "Too many login attempts. Try again in a minute."));
    return;
  }
  attempts.push(now);
  loginAttempts.set(clientIp, attempts);
  next();
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  return bcrypt.compareSync(password, passwordHash);
}

export function createAccessToken(params: { userId: number; role: UserRole; propertyId: number | null }): string {
  const payload = {
    sub: String(params.userId),
    role: params.role,
    property_id: params.propertyId,
  };
  return jwt.sign(payload, settings.jwtSecret, {
    algorithm: settings.jwtAlgorithm,
    expiresIn: `${settings.jwtExpireMinutes}m`,
  });
}

export function createGuestToken(params: { guestId: number }): string {
  const payload = { sub: String(params.guestId), typ: "guest" };
  return jwt.sign(payload, settings.jwtSecret, {
    algorithm: settings.jwtAlgorithm,
    expiresIn: `${settings.jwtExpireMinutes}m`,
  });
}

export interface AdminClaims {
  userId: number;
  role: UserRole;
  propertyId: number | null;
}

export interface GuestClaims {
  guestId: number;
}

/** The JWT lives in an httpOnly cookie so it's inaccessible to JS (no XSS
 * token theft). A second, JS-readable CSRF cookie is issued alongside it —
 * the frontend echoes its value back as a header on mutating requests, and
 * the matching auth middleware checks the two match (the double-submit
 * pattern). SameSite=None (rather than Lax) is required because the
 * frontend/admin apps and this API are deployed on unrelated domains (e.g.
 * separate *.vercel.app projects) rather than subdomains of one shared
 * domain — the double-submit CSRF check is what actually guards against
 * cross-site misuse of the now cross-site-sendable cookie. Browsers require
 * Secure whenever SameSite=None is used. */
function setCookiePair(res: Response, sessionCookie: string, csrfCookie: string, token: string): void {
  const csrfToken = crypto.randomBytes(32).toString("base64url");
  const maxAge = settings.jwtExpireMinutes * 60 * 1000;
  res.cookie(sessionCookie, token, {
    maxAge,
    httpOnly: true,
    secure: settings.cookieSecure,
    sameSite: "none",
    path: "/",
  });
  res.cookie(csrfCookie, csrfToken, {
    maxAge,
    httpOnly: false,
    secure: settings.cookieSecure,
    sameSite: "none",
    path: "/",
  });
}

function clearCookiePair(res: Response, sessionCookie: string, csrfCookie: string): void {
  res.clearCookie(sessionCookie, { path: "/" });
  res.clearCookie(csrfCookie, { path: "/" });
}

function checkCsrf(req: Request, csrfCookieName: string): void {
  if (SAFE_METHODS.has(req.method)) return;
  const csrfCookie: string | undefined = req.cookies?.[csrfCookieName];
  const csrfHeader = req.header("x-csrf-token");
  if (
    !csrfCookie ||
    !csrfHeader ||
    csrfCookie.length !== csrfHeader.length ||
    !crypto.timingSafeEqual(Buffer.from(csrfCookie), Buffer.from(csrfHeader))
  ) {
    throw new HttpError(403, "Invalid or missing CSRF token");
  }
}

export function setSessionCookies(res: Response, token: string): void {
  setCookiePair(res, SESSION_COOKIE, CSRF_COOKIE, token);
}

export function clearSessionCookies(res: Response): void {
  clearCookiePair(res, SESSION_COOKIE, CSRF_COOKIE);
}

export function setGuestSessionCookies(res: Response, token: string): void {
  setCookiePair(res, GUEST_SESSION_COOKIE, GUEST_CSRF_COOKIE, token);
}

export function clearGuestSessionCookies(res: Response): void {
  clearCookiePair(res, GUEST_SESSION_COOKIE, GUEST_CSRF_COOKIE);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminClaims;
      guest?: GuestClaims;
    }
  }
}

export function getCurrentAdmin(req: Request, _res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    next(new HttpError(401, "Not authenticated"));
    return;
  }
  try {
    const payload = jwt.verify(token, settings.jwtSecret, { algorithms: [settings.jwtAlgorithm] }) as jwt.JwtPayload;
    const role = payload.role as UserRole;
    if (!payload.sub || !Object.values(UserRole).includes(role)) throw new Error("bad payload");
    req.admin = {
      userId: parseInt(payload.sub, 10),
      role,
      propertyId: payload.property_id ?? null,
    };
  } catch {
    next(new HttpError(401, "Invalid or expired session"));
    return;
  }

  try {
    checkCsrf(req, CSRF_COOKIE);
  } catch (err) {
    next(err);
    return;
  }
  next();
}

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  getCurrentAdmin(req, _res, (err?: unknown) => {
    if (err) {
      next(err);
      return;
    }
    if (req.admin!.role !== UserRole.super_admin) {
      next(new HttpError(403, "Super admin only"));
      return;
    }
    next();
  });
}

export function getCurrentGuest(req: Request, _res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.[GUEST_SESSION_COOKIE];
  if (!token) {
    next(new HttpError(401, "Not authenticated"));
    return;
  }
  try {
    const payload = jwt.verify(token, settings.jwtSecret, { algorithms: [settings.jwtAlgorithm] }) as jwt.JwtPayload;
    if (payload.typ !== "guest" || !payload.sub) throw new Error("wrong token type");
    req.guest = { guestId: parseInt(payload.sub, 10) };
  } catch {
    next(new HttpError(401, "Invalid or expired session"));
    return;
  }

  try {
    checkCsrf(req, GUEST_CSRF_COOKIE);
  } catch (err) {
    next(err);
    return;
  }
  next();
}

/** Never trust a client-supplied property_id for a scoped user — always
 * override it with the property_id embedded in their own token. */
export function scopePropertyId(requestedPropertyId: number | null | undefined, admin: AdminClaims): number | null {
  if (admin.role === UserRole.property_manager) {
    return admin.propertyId;
  }
  return requestedPropertyId ?? null;
}
