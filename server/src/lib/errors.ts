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
