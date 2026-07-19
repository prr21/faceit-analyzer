import fs from "fs"
import {
  fetchMatchVoices,
  loadVoiceManifest,
  voiceAudioPath,
} from "@faceit/core"
import type {
  FaceitClient,
  VoiceManifest,
  VoicePlayerDto,
  VoiceProgressStep,
  VoiceStatusDto,
} from "@faceit/core"
import { AppError } from "../lib/errors"

interface VoiceJob {
  status: "pending" | "extracting" | "done" | "error"
  step?: VoiceProgressStep
  manifest?: VoiceManifest
  error?: string
}

// In-memory джобы: теряются при рестарте, но готовые MP3 остаются в кеше
const jobs = new Map<string, VoiceJob>()

const MATCH_ID_RE = /^[0-9a-zA-Z-]{5,100}$/

function assertMatchId(matchId: string): void {
  if (!MATCH_ID_RE.test(matchId)) throw AppError.badRequest("Некорректный matchId")
}

function toDto(matchId: string, manifest: VoiceManifest): VoicePlayerDto[] {
  return manifest.players.map(p => ({
    playerId: p.playerId,
    nickname: p.nickname,
    steamId64: p.steamId64,
    faction: p.faction,
    fileSize: p.fileSize,
    url: `/api/match/${matchId}/voices/${p.steamId64}.mp3`,
  }))
}

/** Статус: none | pending | extracting | done | error (учитывает дисковый кеш) */
export function getVoiceStatus(matchId: string): VoiceStatusDto {
  assertMatchId(matchId)
  const job = jobs.get(matchId)
  if (job) {
    return {
      status: job.status,
      step: job.step,
      players: job.manifest ? toDto(matchId, job.manifest) : undefined,
      error: job.error,
    }
  }
  const cached = loadVoiceManifest(matchId)
  if (cached) return { status: "done", players: toDto(matchId, cached) }
  return { status: "none" }
}

/** Запуск извлечения (дедуп по matchId; кеш-хит → сразу done) */
export function startVoiceExtraction(client: FaceitClient, matchId: string): VoiceStatusDto {
  assertMatchId(matchId)
  const existing = jobs.get(matchId)
  if (existing && existing.status !== "error") return getVoiceStatus(matchId)
  if (loadVoiceManifest(matchId)) return getVoiceStatus(matchId)

  const job: VoiceJob = { status: "pending" }
  jobs.set(matchId, job)

  fetchMatchVoices(client, matchId, {
    onProgress: step => {
      job.status = "extracting"
      job.step = step
    },
  })
    .then(manifest => {
      job.status = "done"
      job.step = undefined
      job.manifest = manifest
    })
    .catch((err: any) => {
      job.status = "error"
      job.step = undefined
      job.error =
        err?.code === "DEMO_NOT_AVAILABLE"
          ? "Демка недоступна — FACEIT хранит демки ограниченное время"
          : err?.status === 401 || err?.status === 403
            ? "FACEIT отклонил сессионный токен — обновите FACEIT_SESSION_TOKEN в .env"
            : err?.message ?? "Неизвестная ошибка"
      console.error(`[voice] Ошибка извлечения ${matchId}:`, err?.message ?? err)
    })

  return { status: "pending" }
}

/** Абсолютный путь к mp3 для res.sendFile; валидация имени — защита от path traversal */
export function getVoiceFilePath(matchId: string, fileName: string): string {
  assertMatchId(matchId)
  if (!/^\d{17}\.mp3$/.test(fileName)) throw AppError.badRequest("Некорректное имя файла")
  const filePath = voiceAudioPath(matchId, fileName.replace(/\.mp3$/, ""))
  if (!fs.existsSync(filePath)) throw AppError.notFound("Аудиофайл не найден")
  return filePath
}
