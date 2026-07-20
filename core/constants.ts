export const DEFAULT_MATCH_LIMIT = 100
export const DEFAULT_GAME = "cs2"
export const DEFAULT_CONCURRENCY = 10

export interface MapPoolEntry {
  id: string // "de_mirage"
  name: string // "Mirage"
  addedAt: string // ISO-дата попадания в Active Duty — для tenure-логики
}

// Официальный Active Duty пул CS2 (Valve, меняется ~раз в сезон).
// addedAt используется, чтобы отличать «команда избегает старую карту» от
// «карта недавно добавлена — статистика ещё копится».
export const ACTIVE_MAP_POOL_META: MapPoolEntry[] = [
  { id: "de_ancient", name: "Ancient", addedAt: "2023-09-27" },
  { id: "de_anubis", name: "Anubis", addedAt: "2023-09-27" },
  { id: "de_dust2", name: "Dust II", addedAt: "2023-09-27" },
  { id: "de_inferno", name: "Inferno", addedAt: "2023-09-27" },
  { id: "de_mirage", name: "Mirage", addedAt: "2023-09-27" },
  { id: "de_nuke", name: "Nuke", addedAt: "2023-09-27" },
  { id: "de_cache", name: "Cache", addedAt: "2026-06-01" }, // недавно вернулась в пул
]

export const ACTIVE_MAP_POOL = ACTIVE_MAP_POOL_META.map(m => m.id)

// Голоса из демок
export const CSGOVE_VERSION = "v3.1.6"
export const CSGOVE_DOWNLOAD_BASE =
  "https://github.com/akiver/csgo-voice-extractor/releases/download"
export const FACEIT_DOWNLOAD_API_URL =
  "https://open.faceit.com/download/v2/demos/download"
export const VOICE_MP3_BITRATE = "64k"
