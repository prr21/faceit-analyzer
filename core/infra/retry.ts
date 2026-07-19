export type RetryLogger = (message: string) => void

let _logger: RetryLogger = (msg) => console.warn(msg)

export function setRetryLogger(logger: RetryLogger): void {
  _logger = logger
}

// Коды сетевых сбоев Node/axios/undici — временные, имеет смысл ретраить
const NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNABORTED",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ERR_NETWORK",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
])

function isRetryable(error: unknown): boolean {
  const e = error as {
    response?: { status?: number }
    status?: number
    code?: string
  } | null

  const status = e?.response?.status ?? e?.status
  if (typeof status === "number") return status === 429 || status >= 500

  if (e?.code && NETWORK_ERROR_CODES.has(e.code)) return true
  // fetch кидает TypeError при сетевом сбое
  return error instanceof TypeError
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      if (attempt === maxRetries || !isRetryable(error)) throw error
      const delay = baseDelay * Math.pow(2, attempt)
      _logger(`⚠️ Retry ${attempt + 1}/${maxRetries} через ${delay}ms...`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error("unreachable")
}
