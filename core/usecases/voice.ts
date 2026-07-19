import fs from "fs"
import path from "path"
import type { FaceitClient } from "../api/client"
import type { VoiceManifest, VoiceProgressStep } from "../types/voice"
import { getMatchInfo, getPlayerInfo } from "../api/faceit-open"
import { getFaceitSessionToken } from "../env"
import { withCache } from "../infra/cache"
import { batchWithLimit } from "../infra/concurrency"
import { DEFAULT_CONCURRENCY } from "../constants"
import {
  parseMatchId,
  extractSteamId,
  collectRoster,
  buildVoiceManifest,
  type RosterEntry,
} from "../voice/manifest"
import { getDemoResourceUrl, fetchSignedDemoUrl, downloadDemo } from "../voice/demo"
import { ensureExtractor } from "../voice/binary"
import { extractVoices } from "../voice/extract"
import { transcodeToMp3 } from "../voice/transcode"

let _voicesRoot = path.resolve(".cache", "voices")
let _demosRoot = path.resolve(".cache", "voice-demos")

/** Переопределение директорий хранения (тесты, кастомное размещение) */
export function setVoiceStorageRoot(voicesDir: string, demosDir: string): void {
  _voicesRoot = voicesDir
  _demosRoot = demosDir
}

export function voiceMatchDir(matchId: string): string {
  return path.join(_voicesRoot, matchId)
}

export function voiceAudioPath(matchId: string, steamId64: string): string {
  return path.join(voiceMatchDir(matchId), `${steamId64}.mp3`)
}

/** Готовый манифест из кеша (пути абсолютизируются) или null */
export function loadVoiceManifest(matchId: string): VoiceManifest | null {
  const manifestPath = path.join(voiceMatchDir(matchId), "manifest.json")
  if (!fs.existsSync(manifestPath)) return null
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as VoiceManifest
  for (const p of manifest.players) {
    p.filePath = path.join(voiceMatchDir(matchId), path.basename(p.filePath))
  }
  return manifest
}

// Side-effect-зависимости инъектируются для тестов
export interface VoiceDeps {
  ensureExtractor: typeof ensureExtractor
  fetchSignedDemoUrl: typeof fetchSignedDemoUrl
  downloadDemo: typeof downloadDemo
  extractVoices: typeof extractVoices
  transcodeToMp3: typeof transcodeToMp3
}

const defaultDeps: VoiceDeps = {
  ensureExtractor,
  fetchSignedDemoUrl,
  downloadDemo,
  extractVoices,
  transcodeToMp3,
}

export interface FetchMatchVoicesOptions {
  /** Локальный .dem — пропустить скачивание */
  demoPath?: string
  /** Не удалять скачанную демку */
  keepDemo?: boolean
  onProgress?: (step: VoiceProgressStep) => void
  deps?: Partial<VoiceDeps>
}

const MATCH_ID_RE = /^[0-9a-zA-Z-]{5,100}$/

/**
 * Голоса матча: кеш-хит → готовый манифест, иначе
 * демка → csgove (split-compact) → MP3 → манифест в .cache/voices/{matchId}/
 */
export async function fetchMatchVoices(
  client: FaceitClient,
  matchIdOrUrl: string,
  options: FetchMatchVoicesOptions = {},
): Promise<VoiceManifest> {
  const deps = { ...defaultDeps, ...options.deps }
  const matchId = parseMatchId(matchIdOrUrl)
  if (!MATCH_ID_RE.test(matchId)) throw new Error(`Некорректный matchId: ${matchId}`)

  const cached = loadVoiceManifest(matchId)
  if (cached) return cached

  const match = await getMatchInfo(client, matchId)

  // Демка: локальный файл или скачивание по сессионному токену
  let demoPath = options.demoPath
  let demoDownloaded = false
  if (!demoPath) {
    const resourceUrl = getDemoResourceUrl(match)
    if (!resourceUrl) {
      const err: any = new Error(
        "У матча нет demo_url — демка недоступна (FACEIT хранит демки ограниченное время)",
      )
      err.code = "DEMO_NOT_AVAILABLE"
      throw err
    }
    options.onProgress?.("download")
    const token = getFaceitSessionToken()
    const signedUrl = await deps.fetchSignedDemoUrl(resourceUrl, token)
    demoPath = path.join(_demosRoot, `${matchId}.dem`)
    await deps.downloadDemo(signedUrl, demoPath)
    demoDownloaded = true
  }

  const finalDir = voiceMatchDir(matchId)
  const tmpDir = `${finalDir}.tmp`
  fs.rmSync(tmpDir, { recursive: true, force: true })
  try {
    options.onProgress?.("extract")
    const exePath = await deps.ensureExtractor()
    const wavFiles = await deps.extractVoices(exePath, demoPath, tmpDir)

    options.onProgress?.("transcode")
    const mp3Files: { steamId64: string; filePath: string; fileSize: number }[] = []
    for (const wav of wavFiles) {
      const steamId64 = extractSteamId(wav)
      if (!steamId64) continue
      const mp3Path = path.join(tmpDir, `${steamId64}.mp3`)
      await deps.transcodeToMp3(wav, mp3Path)
      fs.rmSync(wav)
      mp3Files.push({
        steamId64,
        filePath: `${steamId64}.mp3`, // в манифесте — относительное имя
        fileSize: fs.statSync(mp3Path).size,
      })
    }

    // SteamID неизменен → кешируем отдельным ключом (правило "player info не кешируем" не нарушаем)
    const rosterBase = collectRoster(match)
    const steamIds = await batchWithLimit(
      rosterBase.map(p => () =>
        withCache(`steamid:${p.playerId}`, async () => {
          const info = await getPlayerInfo(client, p.playerId)
          return info?.steam_id_64 ?? ""
        }),
      ),
      DEFAULT_CONCURRENCY,
    )
    const roster: RosterEntry[] = rosterBase.map((p, i) => ({
      ...p,
      steamId64: steamIds[i] || null,
    }))

    const manifest = buildVoiceManifest(matchId, roster, mp3Files)
    fs.writeFileSync(
      path.join(tmpDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf-8",
    )

    // Атомарная публикация: упавшая джоба не оставляет полукеша
    fs.renameSync(tmpDir, finalDir)
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    throw err
  } finally {
    if (demoDownloaded && !options.keepDemo) fs.rmSync(demoPath!, { force: true })
  }

  return loadVoiceManifest(matchId)!
}
