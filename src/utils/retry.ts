export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      if (attempt === maxRetries) throw error
      const status = error?.response?.status ?? error?.status
      if (status === 429 || status >= 500) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(`⚠️ Retry ${attempt + 1}/${maxRetries} через ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
      } else {
        throw error
      }
    }
  }
  throw new Error("unreachable")
}
