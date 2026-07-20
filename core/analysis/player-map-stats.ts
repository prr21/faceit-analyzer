import type { FaceitPlayerGameStats } from "../types/api"
import type { PlayerMapStats } from "../types/domain"
import { isPoolMap } from "./helpers/map-voting"

// Stats API отдаёт label без префикса: "Nuke", "Dust2" → нормализуем в формат пула
export function normalizeMapLabel(label: string): string {
  return "de_" + label.toLowerCase().replace(/\s+/g, "")
}

function toNumber(value: string | undefined): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Разбирает агрегированную статистику игрока по картам (5v5, только карты активного пула).
 */
export function parsePlayerMapStats(raw: FaceitPlayerGameStats | null): PlayerMapStats[] {
  if (!raw?.segments) return []

  return raw.segments
    .filter(s => s.type === "Map" && s.mode === "5v5")
    .map(s => ({ segment: s, map: normalizeMapLabel(s.label) }))
    .filter(({ map }) => isPoolMap(map))
    .map(({ segment, map }) => ({
      map,
      matches: toNumber(segment.stats["Matches"]),
      wins: toNumber(segment.stats["Wins"]),
      winRate: toNumber(segment.stats["Win Rate %"]),
      avgKd: toNumber(segment.stats["Average K/D Ratio"]),
      avgKr: toNumber(segment.stats["Average K/R Ratio"]),
      adr: toNumber(segment.stats["ADR"]),
    }))
    .sort((a, b) => b.matches - a.matches)
}
