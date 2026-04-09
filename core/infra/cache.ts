import fs from "fs"
import path from "path"
import crypto from "crypto"

export interface CacheProvider {
  get<T>(key: string): T | null | Promise<T | null>
  set<T>(key: string, data: T): void | Promise<void>
}

const CACHE_DIR = path.resolve(".cache")

export class FileSystemCache implements CacheProvider {
  get<T>(key: string): T | null {
    const filePath = this.getPath(key)
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(raw) as T
  }

  set<T>(key: string, data: T): void {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(this.getPath(key), JSON.stringify(data), "utf-8")
  }

  private getPath(key: string): string {
    const hash = crypto.createHash("md5").update(key).digest("hex")
    return path.join(CACHE_DIR, `${hash}.json`)
  }
}

let _provider: CacheProvider = new FileSystemCache()

export function setCacheProvider(provider: CacheProvider): void {
  _provider = provider
}

export function getCached<T>(key: string): T | null | Promise<T | null> {
  return _provider.get<T>(key)
}

export function setCache<T>(key: string, data: T): void | Promise<void> {
  return _provider.set(key, data)
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await _provider.get<T>(key)
  if (cached !== null) return cached

  const data = await fetcher()
  if (data !== null) await _provider.set(key, data)
  return data
}
