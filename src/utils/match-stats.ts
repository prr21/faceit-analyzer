import type {
  FactionBanPickStats,
  MapWinRate,
  TrendPeriod,
  FavoriteUnderdogStats,
  CompetitionTypeStats,
  FaceitMatchDetail,
  MatchRecord,
} from "../types/faceit.js"
import { replaceLangPlaceholder } from "./dedup.js"

export function createEmptyFactionStats(): FactionBanPickStats {
  return { firstBan: {}, firstPick: {}, secondBan: {}, thirdBan: {} }
}

export function createEmptyFavoriteUnderdog(): FavoriteUnderdogStats {
  return {
    asFavorite: { wins: 0, losses: 0, total: 0, rate: 0 },
    asUnderdog: { wins: 0, losses: 0, total: 0, rate: 0 },
  }
}

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

export function buildMatchRecord(
  match: FaceitMatchDetail,
  targetFaction: "faction1" | "faction2",
  mapName: string,
  mapIndex: number,
  won: boolean,
): MatchRecord {
  const opponentFaction = targetFaction === "faction1" ? "faction2" : "faction1"
  const opponentTeam = match.teams[opponentFaction]
  const targetTeam = match.teams[targetFaction]

  let mapScore = "—"
  if (match.detailed_results?.[mapIndex]) {
    const dr = match.detailed_results[mapIndex]
    const ts = dr.factions[targetFaction]?.score ?? 0
    const os = dr.factions[opponentFaction]?.score ?? 0
    mapScore = `${ts}:${os}`
  } else if (match.results?.score) {
    const ts = match.results.score[targetFaction] ?? 0
    const os = match.results.score[opponentFaction] ?? 0
    mapScore = `${ts}:${os}`
  }

  let matchScore: string | undefined
  if (match.best_of > 1 && match.results?.score) {
    const ts = match.results.score[targetFaction] ?? 0
    const os = match.results.score[opponentFaction] ?? 0
    matchScore = `${ts}:${os}`
  }

  const faceitUrl = match.faceit_url
    ? replaceLangPlaceholder(match.faceit_url)
    : `https://www.faceit.com/en/cs2/room/${match.match_id}`

  return {
    matchId: match.match_id,
    date: match.started_at,
    faceitUrl,
    won,
    mapScore,
    matchScore,
    bestOf: match.best_of,
    opponentName: opponentTeam.name || "Неизвестный",
    targetRating: targetTeam.stats?.rating,
    opponentRating: opponentTeam.stats?.rating,
    competitionName: match.competition_name,
  }
}

export function addMatchRecord(
  records: Record<string, MatchRecord[]>,
  mapName: string,
  record: MatchRecord,
): void {
  if (!records[mapName]) records[mapName] = []
  records[mapName].push(record)
}

export function getMonthKey(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function getOrCreateTrend(trendsMap: Map<string, TrendPeriod>, key: string): TrendPeriod {
  let trend = trendsMap.get(key)
  if (!trend) {
    trend = {
      label: key,
      stats: createEmptyFactionStats(),
      decider: {},
      mapWinRate: {},
      matchCount: 0,
      avgElo: 0,
    }
    trendsMap.set(key, trend)
  }
  return trend
}
