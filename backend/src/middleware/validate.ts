import { NextFunction, Request, Response } from "express";
import { ZodTypeAny, z } from "zod";

/** Parses+validates req.body against `schema`, replacing req.body with the
 * parsed (and any zod `.transform()`ed) value — mirrors FastAPI's automatic
 * Pydantic body parsing. Validation failures are forwarded to the ZodError
 * branch of the error handler, which replies 422 in the same shape Pydantic
 * used, so the frontend's existing error-message extraction keeps working. */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Same idea for query-string params — coerces numeric-looking fields via the
 * schema (query params always arrive as strings). */
export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      (req as any).validatedQuery = schema.parse(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export { z };
