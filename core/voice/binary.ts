import fs from "fs"
import path from "path"
import { Readable } from "stream"
import { pipeline } from "stream/promises"
import extractZip from "extract-zip"
import { CSGOVE_DOWNLOAD_BASE, CSGOVE_VERSION } from "../constants"

/** Имя ассета релиза csgove для платформы */
export function csgoveAssetName(platform: NodeJS.Platform = process.platform): string {
  switch (platform) {
    case "win32": return "win32-x64.zip"
    case "linux": return "linux-x64.zip"
    case "darwin": return "darwin-x64.zip"
    default:
      throw new Error(`Платформа ${platform} не поддерживается csgo-voice-extractor`)
  }
}

export function csgoveBinaryName(platform: NodeJS.Platform = process.platform): string {
  return platform === "win32" ? "csgove.exe" : "csgove"
}

/** Реальное скачивание релиза + распаковка (в тестах подменяется целиком) */
async function downloadAndUnzip(url: string, destDir: string): Promise<void> {
  const zipPath = path.join(destDir, "csgove.zip")
  const response = await fetch(url, { redirect: "follow" })
  if (!response.ok || !response.body) {
    const err: any = new Error(`HTTP ${response.status} при скачивании ${url}`)
    err.status = response.status
    throw err
  }
  await pipeline(Readable.fromWeb(response.body as any), fs.createWriteStream(zipPath))
  await extractZip(zipPath, { dir: destDir })
  fs.rmSync(zipPath)
}

/**
 * Гарантирует наличие бинарника csgove: качает и распаковывает релиз
 * при первом вызове. Возвращает путь к исполняемому файлу.
 */
export async function ensureExtractor(
  toolsDir: string = path.resolve("tools", "csgove"),
  fetchArchive: (url: string, destDir: string) => Promise<void> = downloadAndUnzip,
): Promise<string> {
  const exePath = path.join(toolsDir, csgoveBinaryName())
  if (fs.existsSync(exePath)) return exePath

  fs.mkdirSync(toolsDir, { recursive: true })
  const asset = csgoveAssetName()
  console.log(`⬇️ Скачивание csgo-voice-extractor ${CSGOVE_VERSION} (${asset})...`)
  await fetchArchive(`${CSGOVE_DOWNLOAD_BASE}/${CSGOVE_VERSION}/${asset}`, toolsDir)

  if (!fs.existsSync(exePath)) {
    throw new Error(`После распаковки не найден ${exePath} — проверьте структуру релиза csgove`)
  }
  if (process.platform !== "win32") fs.chmodSync(exePath, 0o755)
  return exePath
}
