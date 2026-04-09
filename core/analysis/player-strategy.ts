import { formatTimestamp } from "../infra/date-format"
import type { FaceitMatchDetail, PlayerDropPickStats, MapWinRate, MatchRecord } from "../types/index"
import type { MatchWithData, AnalysisConfig, FactionKey } from "../types/analysis"
import { runAnalysisPipeline } from "./pipeline"
import { incrementMapCount, trackWinRate } from "./helpers/trackers"
import { isPoolMap } from "./helpers/map-voting"
import { buildMatchRecord, addMatchRecord } from "./helpers/match-record"
import { calcStreaks } from "./helpers/streaks"
import { fillEloChanges } from "./helpers/elo-changes"

export function findPlayerFaction(
  match: FaceitMatchDetail,
  playerId: string,
): FactionKey | null {
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
  const leaderMapWinRate: Record<string, MapWinRate> = {}
  const leaderMatchRecords: Record<string, MatchRecord[]> = {}

  const config: AnalysisConfig = {
    resolveFaction: (match) => findPlayerFaction(match, playerId),
    shouldProcessVoting: (match) => isLeader(match, playerId) && !!match,
    processVotingEntity: (entity, phase, targetFaction, acc, trend) => {
      if (entity.selected_by === targetFaction) {
        incrementMapCount(acc.targetStats[phase], entity.guid)
        incrementMapCount(trend.stats[phase], entity.guid)
      }
    },
    playerId,
    onMatch: (ctx, acc, trend) => {
      const playerIsLeader = isLeader(ctx.match, playerId)

      // Leader-специфичный win rate
      const playedMaps = ctx.match.voting?.map?.pick || []
      if (playerIsLeader && ctx.match.results?.winner && playedMaps.length > 0) {
        if (ctx.match.detailed_results && ctx.match.detailed_results.length > 0) {
          const count = Math.min(playedMaps.length, ctx.match.detailed_results.length)
          for (let i = 0; i < count; i++) {
            if (!isPoolMap(playedMaps[i])) continue
            const mapWon = ctx.match.detailed_results[i].winner === ctx.targetFaction
            trackWinRate(leaderMapWinRate, playedMaps[i], mapWon)
            trackWinRate(trend.leaderMapWinRate, playedMaps[i], mapWon)
            const record = buildMatchRecord(ctx.match, ctx.targetFaction, playedMaps[i], i, mapWon, ctx.matchStats, playerId)
            addMatchRecord(leaderMatchRecords, playedMaps[i], record)
          }
        } else {
          for (let i = 0; i < playedMaps.length; i++) {
            if (!isPoolMap(playedMaps[i])) continue
            trackWinRate(leaderMapWinRate, playedMaps[i], ctx.won)
            trackWinRate(trend.leaderMapWinRate, playedMaps[i], ctx.won)
            const record = buildMatchRecord(ctx.match, ctx.targetFaction, playedMaps[i], i, ctx.won, ctx.matchStats, playerId)
            addMatchRecord(leaderMatchRecords, playedMaps[i], record)
          }
        }
        trend.leaderMatchCount++
      } else if (playerIsLeader) {
        trend.leaderMatchCount++
      }
    },
  }

  const acc = runAnalysisPipeline(matchesData, config)

  // Post-processing
  acc.eloHistory.sort((a, b) => a.date - b.date)

  const result: PlayerDropPickStats = {
    stats: acc.targetStats,
    decider: acc.decider,
    mapWinRate: acc.mapWinRate,
    deciderWinRate: acc.deciderWinRate,
    eloHistory: acc.eloHistory,
    favoriteUnderdog: acc.favoriteUnderdog,
    competitionStats: acc.competitionStats,
    matchRecords: acc.matchRecords,
    leaderMapWinRate,
    leaderMatchRecords,
    avgElo: acc.eloCount > 0 ? Math.round(acc.eloSum / acc.eloCount) : 0,
    trends: [...acc.trendsMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
    earliestGame: acc.earliestGame < Infinity ? formatTimestamp(acc.earliestGame) : "",
    latestGame: acc.latestGame > 0 ? formatTimestamp(acc.latestGame) : "",
    mapInfo: `Анализ на основе ${acc.analyzedMatches} матчей, где "${nickname}" был лидером`,
    count: acc.analyzedMatches,
    allCount: matchesData.length,
  }

  if (result.eloHistory.length > 0) {
    const streaks = calcStreaks(result.eloHistory)
    result.longestWinStreak = streaks.longest
    result.currentStreak = streaks.current
  }

  fillEloChanges(result.matchRecords, result.eloHistory)
  fillEloChanges(leaderMatchRecords, result.eloHistory)

  for (const records of Object.values(result.matchRecords)) {
    records.sort((a, b) => b.date - a.date)
  }
  for (const records of Object.values(leaderMatchRecords)) {
    records.sort((a, b) => b.date - a.date)
  }

  return result
}
