import fs from "fs"
import path from "path"
import crypto from "crypto"

const CACHE_DIR = path.resolve(".cache")

function ensureCacheDir(): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function getCachePath(key: string): string {
  const hash = crypto.createHash("md5").update(key).digest("hex")
  return path.join(CACHE_DIR, `${hash}.json`)
}

export function getCached<T>(key: string): T | null {
  const filePath = getCachePath(key)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as T
}

export function setCache<T>(key: string, data: T): void {
  ensureCacheDir()
  fs.writeFileSync(getCachePath(key), JSON.stringify(data), "utf-8")
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = getCached<T>(key)
  if (cached !== null) return cached

  const data = await fetcher()
  if (data !== null) setCache(key, data)
  return data
}
