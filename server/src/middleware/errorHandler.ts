import type { Request, Response, NextFunction } from "express"
import { AppError } from "../lib/errors"

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    })
    return
  }

  // Axios errors от FACEIT API
  if ("response" in err) {
    const status = (err as any).response?.status ?? 502
    res.status(status).json({
      error: "Upstream API error",
      code: "UPSTREAM_ERROR",
    })
    return
  }

  console.error("Unhandled error:", err)
  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    code: "INTERNAL_ERROR",
  })
}
