import { formatTimestamp } from "../infra/date-format"
import type { FaceitMatchDetail, FactionBanPickStats, TeamDropPickStats } from "../types/index"
import type { MatchWithData, AnalysisConfig, FactionKey } from "../types/analysis"
import { runAnalysisPipeline } from "./pipeline"
import { incrementMapCount } from "./helpers/trackers"
import { createEmptyFactionStats } from "./helpers/factories"

export function findTargetFaction(
  match: FaceitMatchDetail,
  teamPlayerIds: string[],
): FactionKey | null {
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
  const enemyStats: FactionBanPickStats = createEmptyFactionStats()

  const config: AnalysisConfig = {
    resolveFaction: (match) => findTargetFaction(match, teamPlayerIds),
    shouldProcessVoting: () => true,
    processVotingEntity: (entity, phase, targetFaction, acc, trend) => {
      if (entity.selected_by === targetFaction) {
        incrementMapCount(acc.targetStats[phase], entity.guid)
        incrementMapCount(trend.stats[phase], entity.guid)
      } else {
        incrementMapCount(enemyStats[phase], entity.guid)
      }
    },
  }

  const acc = runAnalysisPipeline(matchesWithDetail, config)

  // Post-processing
  acc.eloHistory.sort((a, b) => a.date - b.date)

  for (const records of Object.values(acc.matchRecords)) {
    records.sort((a, b) => b.date - a.date)
  }

  return {
    target: acc.targetStats,
    enemy: enemyStats,
    decider: acc.decider,
    mapWinRate: acc.mapWinRate,
    deciderWinRate: acc.deciderWinRate,
    eloHistory: acc.eloHistory,
    favoriteUnderdog: acc.favoriteUnderdog,
    competitionStats: acc.competitionStats,
    matchRecords: acc.matchRecords,
    avgElo: acc.eloCount > 0 ? Math.round(acc.eloSum / acc.eloCount) : 0,
    trends: [...acc.trendsMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
    earliestGame: acc.earliestGame < Infinity ? formatTimestamp(acc.earliestGame) : "",
    latestGame: acc.latestGame > 0 ? formatTimestamp(acc.latestGame) : "",
    mapInfo: `Анализ на основе ${acc.analyzedMatches} матчей, в котором играли минимум 3 человека из команды "${teamName}"`,
    count: acc.analyzedMatches,
    allCount: matchesWithDetail.length,
  }
}
