import type {
  FactionBanPickStats,
  MapWinRate,
  TrendPeriod,
  FavoriteUnderdogStats,
  CompetitionTypeStats,
  FaceitMatchDetail,
  FaceitMatchStats,
  MatchRecord,
  StreakInfo,
  EloSnapshot,
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

/** Извлекает статистику конкретного игрока из match stats для конкретной карты (roundIndex) */
function extractPlayerStats(
  stats: FaceitMatchStats | null | undefined,
  playerId: string,
  roundIndex: number,
): Partial<Pick<MatchRecord, "kills" | "deaths" | "assists" | "headshots" | "headshotPercent" | "adr" | "kr" | "kdRatio">> {
  if (!stats?.rounds?.[roundIndex]) return {}
  const round = stats.rounds[roundIndex]
  for (const team of round.teams) {
    for (const player of team.players) {
      if (player.player_id === playerId) {
        const s = player.player_stats
        return {
          kills: parseInt(s["Kills"]) || undefined,
          deaths: parseInt(s["Deaths"]) || undefined,
          assists: parseInt(s["Assists"]) || undefined,
          headshots: parseInt(s["Headshots"]) || undefined,
          headshotPercent: parseFloat(s["Headshots %"]) || undefined,
          adr: parseFloat(s["ADR"]) || undefined,
          kr: parseFloat(s["K/R Ratio"]) || undefined,
          kdRatio: parseFloat(s["K/D Ratio"]) || undefined,
        }
      }
    }
  }
  return {}
}

export function buildMatchRecord(
  match: FaceitMatchDetail,
  targetFaction: "faction1" | "faction2",
  mapName: string,
  mapIndex: number,
  won: boolean,
  matchStats?: FaceitMatchStats | null,
  playerId?: string,
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

  const playerStatsData = playerId ? extractPlayerStats(matchStats, playerId, mapIndex) : {}

  // Ссылка на команду противника (только для турнирных/premade команд)
  let opponentTeamUrl: string | undefined
  if (opponentTeam.faction_id && opponentTeam.type === "premade") {
    opponentTeamUrl = `https://www.faceit.com/en/teams/${opponentTeam.faction_id}`
  }

  // Ссылка на турнир (только для не-matchmaking)
  let competitionUrl: string | undefined
  if (match.competition_id && match.competition_type && match.competition_type !== "matchmaking") {
    competitionUrl = `https://www.faceit.com/en/championship/${match.competition_id}`
  }

  return {
    matchId: match.match_id,
    date: match.started_at,
    faceitUrl,
    won,
    mapScore,
    matchScore,
    bestOf: match.best_of,
    opponentName: opponentTeam.name || "Неизвестный",
    opponentTeamUrl,
    targetRating: targetTeam.stats?.rating,
    opponentRating: opponentTeam.stats?.rating,
    competitionName: match.competition_name,
    competitionUrl,
    ...playerStatsData,
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

/** Вычисляет longest win streak и текущую серию из хронологически отсортированного eloHistory */
export function calcStreaks(eloHistory: EloSnapshot[]): { longest: number; current: StreakInfo } {
  let longestWin = 0
  let currentCount = 0
  let currentType: "win" | "loss" = "win"

  for (const entry of eloHistory) {
    if (entry.result === currentType) {
      currentCount++
    } else {
      currentType = entry.result
      currentCount = 1
    }
    if (currentType === "win" && currentCount > longestWin) {
      longestWin = currentCount
    }
  }

  return {
    longest: longestWin,
    current: { type: currentType, count: currentCount },
  }
}

/** Заполняет eloChange в matchRecords на основе хронологически отсортированного eloHistory */
export function fillEloChanges(
  matchRecords: Record<string, MatchRecord[]>,
  eloHistory: EloSnapshot[],
): void {
  // Создаём карту matchId → eloChange
  const eloChangeByMatchId = new Map<string, number>()
  for (let i = 0; i < eloHistory.length; i++) {
    const id = eloHistory[i].matchId
    if (!id) continue
    if (i === 0) {
      eloChangeByMatchId.set(id, 0)
    } else {
      eloChangeByMatchId.set(id, eloHistory[i].elo - eloHistory[i - 1].elo)
    }
  }

  for (const records of Object.values(matchRecords)) {
    for (const record of records) {
      const change = eloChangeByMatchId.get(record.matchId)
      if (change !== undefined) {
        record.eloChange = change
      }
    }
  }
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
      leaderMapWinRate: {},
      leaderMatchCount: 0,
    }
    trendsMap.set(key, trend)
  }
  return trend
}
