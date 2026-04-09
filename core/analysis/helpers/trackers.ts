import type {
  MapWinRate,
  FavoriteUnderdogStats,
  CompetitionTypeStats,
  MapCountRecord,
} from "../../types/index"

export function trackWinRate(record: Record<string, MapWinRate>, mapName: string, won: boolean): void {
  if (!record[mapName]) record[mapName] = { wins: 0, losses: 0, total: 0, rate: 0 }
  const entry = record[mapName]
  if (won) entry.wins++
  else entry.losses++
  entry.total++
  entry.rate = Math.round((entry.wins / entry.total) * 100)
}

export function trackFavoriteUnderdog(
  stats: FavoriteUnderdogStats,
  winProbability: number,
  won: boolean,
): void {
  const side = winProbability >= 0.5 ? stats.asFavorite : stats.asUnderdog
  if (won) side.wins++
  else side.losses++
  side.total++
  side.rate = Math.round((side.wins / side.total) * 100)
}

export function trackCompetitionType(
  stats: CompetitionTypeStats,
  competitionType: string,
  won: boolean,
): void {
  const type = competitionType || "unknown"
  if (!stats[type]) stats[type] = { wins: 0, losses: 0, total: 0, rate: 0 }
  const entry = stats[type]
  if (won) entry.wins++
  else entry.losses++
  entry.total++
  entry.rate = Math.round((entry.wins / entry.total) * 100)
}

export function incrementMapCount(
  record: MapCountRecord,
  mapName: string,
): void {
  record[mapName] = (record[mapName] || 0) + 1
}
