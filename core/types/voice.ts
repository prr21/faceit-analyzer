// Типы фичи «голоса из матча» — общие для core, server и web

export interface VoicePlayerAudio {
  playerId: string
  nickname: string
  steamId64: string
  faction: "faction1" | "faction2"
  /** Абсолютный путь к mp3 (в manifest.json на диске — относительное имя файла) */
  filePath: string
  fileSize: number
}

export interface VoiceManifest {
  matchId: string
  extractedAt: number
  mode: "split-compact"
  players: VoicePlayerAudio[]
}

export type VoiceProgressStep = "download" | "extract" | "transcode"

// DTO для HTTP (server → web): вместо filePath — url
export interface VoicePlayerDto {
  playerId: string
  nickname: string
  steamId64: string
  faction: "faction1" | "faction2"
  fileSize: number
  url: string
}

export type VoiceJobStatusKind = "none" | "pending" | "extracting" | "done" | "error"

export interface VoiceStatusDto {
  status: VoiceJobStatusKind
  step?: VoiceProgressStep
  players?: VoicePlayerDto[]
  error?: string
}
