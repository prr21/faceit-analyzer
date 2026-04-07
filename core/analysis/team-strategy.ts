import {
  findMapVotingTicket,
  isPoolMap,
  classifyVotingEntity,
  getDeciderRound,
  incrementMapCount,
} from "../utils/map-voting.js"
import {
  createEmptyFactionStats,
  createEmptyFavoriteUnderdog,
  trackWinRate,
  trackFavoriteUnderdog,
  trackCompetitionType,
  buildMatchRecord,
  addMatchRecord,
  getMonthKey,
  getOrCreateTrend,
} from "../utils/match-stats.js"
import type {
  FaceitMatchDetail,
  TeamDropPickStats,
  TrendPeriod,
} from "../types/faceit.js"
import type { MatchWithData } from "./player-strategy.js"

export function findTargetFaction(
  match: FaceitMatchDetail,
  teamPlayerIds: string[],
): "faction1" | "faction2" | null {
  for (const playerId of teamPlayerIds) {
    if (match.teams.faction1.leader === playerId) return "faction1"
    if (match.teams.faction2.leader === playerId) return "faction2"
  }
  return null
}

export function analyzeTeamMapStrategy(
  matchesWithDetail: MatchWithData[],
  teamPlayerIds: string[],
  teamName: string,
): TeamDropPickStats {
  const stats: TeamDropPickStats = {
    target: createEmptyFactionStats(),
    enemy: createEmptyFactionStats(),
    decider: {},
    mapWinRate: {},
    deciderWinRate: {},
    eloHistory: [],
    favoriteUnderdog: createEmptyFavoriteUnderdog(),
    competitionStats: {},
    matchRecords: {},
    avgElo: 0,
    trends: [],
    earliestGame: "",
    latestGame: "",
    mapInfo: "",
    count: 0,
    allCount: matchesWithDetail.length,
  }
  const trendsMap = new Map<string, TrendPeriod>()
  let eloSum = 0
  let eloCount = 0
  let analyzedMatches = 0
  let latestGame = 0
  let earliestGame = Infinity

  for (const { match, history } of matchesWithDetail) {
    if (!match) continue

    if (match.started_at > latestGame) latestGame = match.started_at
    if (match.started_at < earliestGame) earliestGame = match.started_at

    const targetFaction = findTargetFaction(match, teamPlayerIds)
    if (!targetFaction) continue

    const won = match.results?.winner === targetFaction

    const monthKey = getMonthKey(match.started_at)
    const trend = getOrCreateTrend(trendsMap, monthKey)

    const factionStats = match.teams[targetFaction].stats
    if (factionStats?.rating) {
      stats.eloHistory.push({
        date: match.started_at,
        elo: factionStats.rating,
        result: won ? "win" : "loss",
      })
      eloSum += factionStats.rating
      eloCount++
    }

    if (factionStats?.winProbability !== undefined && match.results?.winner) {
      trackFavoriteUnderdog(stats.favoriteUnderdog, factionStats.winProbability, won)
    }

    if (match.competition_type && match.results?.winner) {
      trackCompetitionType(stats.competitionStats, match.competition_type, won)
    }

    // Баны/Пики
    if (history) {
      const mapVoting = findMapVotingTicket(history)
      if (mapVoting) {
        const deciderRound = getDeciderRound(mapVoting)

        for (const entity of mapVoting.entities) {
          if (!isPoolMap(entity.guid)) continue

          const phase = classifyVotingEntity(entity, deciderRound)
          if (!phase) continue

          if (phase === "decider") {
            incrementMapCount(stats.decider, entity.guid)
            incrementMapCount(trend.decider, entity.guid)
            if (match.results?.winner) {
              trackWinRate(stats.deciderWinRate, entity.guid, won)
            }
            continue
          }

          const side = entity.selected_by === targetFaction ? "target" : "enemy"
          incrementMapCount(stats[side][phase], entity.guid)
          if (side === "target") {
            incrementMapCount(trend.stats[phase], entity.guid)
          }
        }

        analyzedMatches++
      }
    }

    // Винрейт по картам
    const playedMaps = match.voting?.map?.pick || []
    if (match.results?.winner && playedMaps.length > 0) {
      if (match.detailed_results && match.detailed_results.length > 0) {
        const playedCount = Math.min(playedMaps.length, match.detailed_results.length)
        for (let i = 0; i < playedCount; i++) {
          if (!isPoolMap(playedMaps[i])) continue
          const mapWon = match.detailed_results[i].winner === targetFaction
          trackWinRate(stats.mapWinRate, playedMaps[i], mapWon)
          trackWinRate(trend.mapWinRate, playedMaps[i], mapWon)
          addMatchRecord(stats.matchRecords, playedMaps[i], buildMatchRecord(match, targetFaction, playedMaps[i], i, mapWon))
        }
      } else {
        for (let i = 0; i < playedMaps.length; i++) {
          const mapName = playedMaps[i]
          if (!isPoolMap(mapName)) continue
          trackWinRate(stats.mapWinRate, mapName, won)
          trackWinRate(trend.mapWinRate, mapName, won)
          addMatchRecord(stats.matchRecords, mapName, buildMatchRecord(match, targetFaction, mapName, i, won))
        }
      }
    }

    if (factionStats?.rating) {
      const trendEloEntries = stats.eloHistory.filter(e => getMonthKey(e.date) === monthKey)
      trend.avgElo = Math.round(trendEloEntries.reduce((s, e) => s + e.elo, 0) / trendEloEntries.length)
    }

    trend.matchCount++
  }

  stats.avgElo = eloCount > 0 ? Math.round(eloSum / eloCount) : 0
  stats.mapInfo = `Анализ на основе ${analyzedMatches} матчей, в котором играли минимум 3 человека из команды "${teamName}"`
  stats.count = analyzedMatches
  stats.latestGame = latestGame > 0 ? new Date(latestGame * 1000).toLocaleString("ru-RU") : ""
  stats.earliestGame = earliestGame < Infinity ? new Date(earliestGame * 1000).toLocaleString("ru-RU") : ""
  stats.trends = [...trendsMap.values()].sort((a, b) => a.label.localeCompare(b.label))
  stats.eloHistory.sort((a, b) => a.date - b.date)
  for (const records of Object.values(stats.matchRecords)) {
    records.sort((a, b) => b.date - a.date)
  }

  return stats
}
