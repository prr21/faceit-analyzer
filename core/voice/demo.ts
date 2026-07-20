import fs from "fs"
import path from "path"
import { Readable } from "stream"
import { pipeline } from "stream/promises"
import { createGunzip, createZstdDecompress } from "zlib"
import type { FaceitMatchDetail } from "../types/index"
import { FACEIT_DOWNLOAD_API_URL } from "../constants"
import { withRetry } from "../infra/retry"

/** resource_url демки из деталей матча (null — демка недоступна) */
export function getDemoResourceUrl(match: FaceitMatchDetail): string | null {
  return match.demo_url?.[0] ?? null
}

/** Обмен resource_url на подписанный download_url (официальный Downloads API) */
export async function fetchSignedDemoUrl(
  resourceUrl: string,
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  return withRetry(async () => {
    const response = await fetchFn(FACEIT_DOWNLOAD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ resource_url: resourceUrl }),
    })
    if (!response.ok) {
      const err: any = new Error(`HTTP ${response.status} при получении download_url`)
      err.status = response.status
      throw err
    }
    const data = await response.json()
    const url = data?.payload?.download_url
    if (!url) throw new Error("Ответ download-url эндпоинта без payload.download_url")
    return url
  })
}

/** Скачивает демку в destPath, распаковывая gzip/zstd на лету для .gz/.zst */
export async function downloadDemo(
  signedUrl: string,
  destPath: string,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchFn(signedUrl)
  if (!response.ok || !response.body) {
    const err: any = new Error(`HTTP ${response.status} при скачивании демки`)
    err.status = response.status
    throw err
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  const source = Readable.fromWeb(response.body as any)
  const urlPath = new URL(signedUrl).pathname
  if (urlPath.endsWith(".gz")) {
    await pipeline(source, createGunzip(), fs.createWriteStream(destPath))
  } else if (urlPath.endsWith(".zst")) {
    await pipeline(source, createZstdDecompress(), fs.createWriteStream(destPath))
  } else {
    await pipeline(source, fs.createWriteStream(destPath))
  }
}
