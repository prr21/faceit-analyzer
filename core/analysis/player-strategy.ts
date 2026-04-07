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
  calcStreaks,
  fillEloChanges,
} from "../utils/match-stats.js"
import type {
  FaceitMatchDetail,
  FaceitMatchStats,
  PlayerDropPickStats,
  TrendPeriod,
  VotingPayload,
} from "../types/faceit.js"

export interface MatchWithData {
  match: FaceitMatchDetail
  history: VotingPayload | null
  stats: FaceitMatchStats | null
}

export function findPlayerFaction(
  match: FaceitMatchDetail,
  playerId: string,
): "faction1" | "faction2" | null {
  if (match.teams.faction1.leader === playerId) return "faction1"
  if (match.teams.faction2.leader === playerId) return "faction2"
  const f1players = match.teams.faction1.roster || match.teams.faction1.players
  const f2players = match.teams.faction2.roster || match.teams.faction2.players
  if (f1players?.some(p => p.player_id === playerId)) return "faction1"
  if (f2players?.some(p => p.player_id === playerId)) return "faction2"
  return null
}

export function isLeader(match: FaceitMatchDetail, playerId: string): boolean {
  return match.teams.faction1.leader === playerId || match.teams.faction2.leader === playerId
}

export function analyzePlayerMapStrategy(
  matchesData: MatchWithData[],
  playerId: string,
  nickname: string,
): PlayerDropPickStats {
  const playerStats: PlayerDropPickStats = {
    stats: createEmptyFactionStats(),
    decider: {},
    mapWinRate: {},
    deciderWinRate: {},
    eloHistory: [],
    favoriteUnderdog: createEmptyFavoriteUnderdog(),
    competitionStats: {},
    matchRecords: {},
    leaderMapWinRate: {},
    leaderMatchRecords: {},
    avgElo: 0,
    trends: [],
    earliestGame: "",
    latestGame: "",
    mapInfo: "",
    count: 0,
    allCount: matchesData.length,
  }
  const trendsMap = new Map<string, TrendPeriod>()
  let analyzedMatches = 0
  let latestGame = 0
  let earliestGame = Infinity
  let eloSum = 0
  let eloCount = 0

  for (const { match, history, stats: matchStats } of matchesData) {
    if (match.started_at > latestGame) latestGame = match.started_at
    if (match.started_at < earliestGame) earliestGame = match.started_at

    const playerFaction = findPlayerFaction(match, playerId)
    if (!playerFaction) continue

    const won = match.results?.winner === playerFaction

    const monthKey = getMonthKey(match.started_at)
    const trend = getOrCreateTrend(trendsMap, monthKey)

    const factionStats = match.teams[playerFaction].stats
    if (factionStats?.rating) {
      playerStats.eloHistory.push({
        date: match.started_at,
        elo: factionStats.rating,
        result: won ? "win" : "loss",
        matchId: match.match_id,
      })
      eloSum += factionStats.rating
      eloCount++
    }

    if (factionStats?.winProbability !== undefined && match.results?.winner) {
      trackFavoriteUnderdog(playerStats.favoriteUnderdog, factionStats.winProbability, won)
    }

    if (match.competition_type && match.results?.winner) {
      trackCompetitionType(playerStats.competitionStats, match.competition_type, won)
    }

    // Баны/пики — только если игрок лидер и есть voting history
    if (isLeader(match, playerId) && history) {
      const mapVoting = findMapVotingTicket(history)
      if (mapVoting) {
        const deciderRound = getDeciderRound(mapVoting)

        for (const entity of mapVoting.entities) {
          if (!isPoolMap(entity.guid)) continue

          const phase = classifyVotingEntity(entity, deciderRound)
          if (!phase) continue

          if (phase === "decider") {
            incrementMapCount(playerStats.decider, entity.guid)
            incrementMapCount(trend.decider, entity.guid)
            if (match.results?.winner) {
              trackWinRate(playerStats.deciderWinRate, entity.guid, won)
            }
            continue
          }

          if (entity.selected_by === playerFaction) {
            incrementMapCount(playerStats.stats[phase], entity.guid)
            incrementMapCount(trend.stats[phase], entity.guid)
          }
        }

        analyzedMatches++
      }
    }

    const isPlayerLeader = isLeader(match, playerId)

    // Винрейт — для ВСЕХ матчей (не только leader)
    const playedMaps = match.voting?.map?.pick || []
    if (match.results?.winner && playedMaps.length > 0) {
      if (match.detailed_results && match.detailed_results.length > 0) {
        const playedCount = Math.min(playedMaps.length, match.detailed_results.length)
        for (let i = 0; i < playedCount; i++) {
          if (!isPoolMap(playedMaps[i])) continue
          const mapWon = match.detailed_results[i].winner === playerFaction
          trackWinRate(playerStats.mapWinRate, playedMaps[i], mapWon)
          trackWinRate(trend.mapWinRate, playedMaps[i], mapWon)
          const record = buildMatchRecord(match, playerFaction, playedMaps[i], i, mapWon, matchStats, playerId)
          addMatchRecord(playerStats.matchRecords, playedMaps[i], record)
          if (isPlayerLeader) {
            trackWinRate(playerStats.leaderMapWinRate, playedMaps[i], mapWon)
            trackWinRate(trend.leaderMapWinRate, playedMaps[i], mapWon)
            addMatchRecord(playerStats.leaderMatchRecords, playedMaps[i], record)
          }
        }
      } else {
        for (let i = 0; i < playedMaps.length; i++) {
          const mapName = playedMaps[i]
          if (!isPoolMap(mapName)) continue
          trackWinRate(playerStats.mapWinRate, mapName, won)
          trackWinRate(trend.mapWinRate, mapName, won)
          const record = buildMatchRecord(match, playerFaction, mapName, i, won, matchStats, playerId)
          addMatchRecord(playerStats.matchRecords, mapName, record)
          if (isPlayerLeader) {
            trackWinRate(playerStats.leaderMapWinRate, mapName, won)
            trackWinRate(trend.leaderMapWinRate, mapName, won)
            addMatchRecord(playerStats.leaderMatchRecords, mapName, record)
          }
        }
      }
    }

    if (isPlayerLeader) {
      trend.leaderMatchCount++
    }

    if (factionStats?.rating) {
      const trendEloEntries = playerStats.eloHistory.filter(e => getMonthKey(e.date) === monthKey)
      trend.avgElo = Math.round(trendEloEntries.reduce((s, e) => s + e.elo, 0) / trendEloEntries.length)
    }

    trend.matchCount++
  }

  playerStats.avgElo = eloCount > 0 ? Math.round(eloSum / eloCount) : 0
  playerStats.count = analyzedMatches
  playerStats.mapInfo = `Анализ на основе ${analyzedMatches} матчей, где "${nickname}" был лидером`
  playerStats.latestGame = latestGame > 0 ? new Date(latestGame * 1000).toLocaleString("ru-RU") : ""
  playerStats.earliestGame = earliestGame < Infinity ? new Date(earliestGame * 1000).toLocaleString("ru-RU") : ""
  playerStats.trends = [...trendsMap.values()].sort((a, b) => a.label.localeCompare(b.label))
  playerStats.eloHistory.sort((a, b) => a.date - b.date)

  if (playerStats.eloHistory.length > 0) {
    const streaks = calcStreaks(playerStats.eloHistory)
    playerStats.longestWinStreak = streaks.longest
    playerStats.currentStreak = streaks.current
  }

  fillEloChanges(playerStats.matchRecords, playerStats.eloHistory)
  fillEloChanges(playerStats.leaderMatchRecords, playerStats.eloHistory)

  for (const records of Object.values(playerStats.matchRecords)) {
    records.sort((a, b) => b.date - a.date)
  }
  for (const records of Object.values(playerStats.leaderMatchRecords)) {
    records.sort((a, b) => b.date - a.date)
  }

  return playerStats
}
