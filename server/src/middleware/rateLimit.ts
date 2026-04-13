import rateLimitLib from "express-rate-limit"

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

export function rateLimit({ windowMs, maxRequests }: RateLimitOptions) {
  return rateLimitLib({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too Many Requests" },
  })
}
