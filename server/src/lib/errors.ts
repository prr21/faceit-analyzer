export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = "AppError"
  }

  static badRequest(message: string): AppError {
    return new AppError(400, message, "BAD_REQUEST")
  }

  static notFound(message: string): AppError {
    return new AppError(404, message, "NOT_FOUND")
  }

  static internal(message: string): AppError {
    return new AppError(500, message, "INTERNAL_ERROR")
  }
}

/**
 * HTTP-статус ошибки от FACEIT API.
 * Axios кладёт статус в error.response.status, наш fetch-клиент
 * (faceit-internal) — прямо в error.status.
 */
export function upstreamStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined
  const e = err as { response?: { status?: unknown }; status?: unknown }
  const status = e.response?.status ?? e.status
  return typeof status === "number" ? status : undefined
}
