import path from "path"
import type { FaceitMatchDetail } from "../types/index"
import type { VoiceManifest, VoicePlayerAudio } from "../types/voice"

/** matchId из ссылки на match room или из голого id */
export function parseMatchId(input: string): string {
  const trimmed = input.trim()
  const roomMatch = trimmed.match(/\/room\/([0-9a-zA-Z-]+)/)
  return roomMatch ? roomMatch[1] : trimmed
}

/** SteamID64 (17 цифр) из имени WAV-файла экстрактора */
export function extractSteamId(fileName: string): string | null {
  const m = path.basename(fileName).match(/(\d{17})/)
  return m ? m[1] : null
}

export interface RosterEntry {
  playerId: string
  nickname: string
  faction: "faction1" | "faction2"
  steamId64: string | null
}

/** Ростер обеих команд из деталей матча (roster с фолбэком на players) */
export function collectRoster(
  match: FaceitMatchDetail,
): Omit<RosterEntry, "steamId64">[] {
  const result: Omit<RosterEntry, "steamId64">[] = []
  for (const faction of ["faction1", "faction2"] as const) {
    const team = match.teams?.[faction]
    const players = team?.roster ?? team?.players ?? []
    for (const p of players) {
      result.push({ playerId: p.player_id, nickname: p.nickname, faction })
    }
  }
  return result
}

/** Собирает манифест: mp3-файлы (имя = steamId64) + ростер → кто говорил */
export function buildVoiceManifest(
  matchId: string,
  roster: RosterEntry[],
  mp3Files: { steamId64: string; filePath: string; fileSize: number }[],
): VoiceManifest {
  const bySteamId = new Map(
    roster.filter(r => r.steamId64).map(r => [r.steamId64 as string, r]),
  )
  const players: VoicePlayerAudio[] = []
  for (const file of mp3Files) {
    const entry = bySteamId.get(file.steamId64)
    if (!entry) continue // голос не из ростера (наблюдатель и т.п.)
    players.push({
      playerId: entry.playerId,
      nickname: entry.nickname,
      steamId64: file.steamId64,
      faction: entry.faction,
      filePath: file.filePath,
      fileSize: file.fileSize,
    })
  }
  return { matchId, extractedAt: Date.now(), mode: "split-compact", players }
}
