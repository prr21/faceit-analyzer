import type { Request, Response, NextFunction } from "express"
import { AppError, upstreamStatus } from "../lib/errors"

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

  // Ошибки FACEIT API (axios или fetch из faceit-internal)
  const status = upstreamStatus(err)
  if (status !== undefined) {
    console.error(`Ошибка FACEIT API (${status}):`, err.message)

    if (status === 401 || status === 403) {
      res.status(502).json({
        error: "FACEIT API отклонил запрос — проверьте FACEIT_API_KEY в .env",
        code: "UPSTREAM_AUTH",
      })
      return
    }
    if (status === 429) {
      res.status(503).json({
        error: "FACEIT API rate limit исчерпан — повторите позже",
        code: "UPSTREAM_RATE_LIMIT",
      })
      return
    }
    res.status(502).json({
      error: `Ошибка FACEIT API (${status})`,
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
