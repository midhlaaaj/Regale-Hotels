import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/** Mirrors FastAPI's HTTPException — thrown from route handlers, converted to
 * `{"detail": message}` (the exact shape the Nuxt frontend already parses out
 * of `e.data.detail`) by the error-handling middleware below. */
export class HttpError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

/** Wraps an async Express handler so a rejected promise reaches next(err)
 * instead of crashing the process (Express 4 doesn't do this automatically). */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(
  fn: T
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ detail: "Not Found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ detail: err.detail });
    return;
  }
  if (err instanceof ZodError) {
    // Shaped like FastAPI/Pydantic's 422 response body so the frontend's
    // existing `Array.isArray(detail) ? detail.map(d => d.msg)` handling works unchanged.
    res.status(422).json({
      detail: err.issues.map((issue) => ({
        msg: issue.message,
        loc: issue.path,
      })),
    });
    return;
  }
  console.error(err);
  res.status(500).json({ detail: "Internal server error" });
}
