import type {
  MatchWithData,
  MatchContext,
  AnalysisAccumulator,
  AnalysisConfig,
  FactionKey,
} from "../types/analysis"
import { createEmptyFactionStats, createEmptyFavoriteUnderdog } from "./helpers/factories"
import { getMonthKey, getOrCreateTrend } from "./helpers/trends"
import { processElo } from "./steps/elo-tracking"
import { processFavoriteUnderdog } from "./steps/favorite-underdog"
import { processCompetitionType } from "./steps/competition-type"
import { processVoting } from "./steps/voting-analysis"
import { processWinRate } from "./steps/win-rate"
import { processTrendElo } from "./steps/trend-elo"

function createAccumulator(): AnalysisAccumulator {
  return {
    eloHistory: [],
    eloSum: 0,
    eloCount: 0,
    favoriteUnderdog: createEmptyFavoriteUnderdog(),
    competitionStats: {},
    mapWinRate: {},
    deciderWinRate: {},
    matchRecords: {},
    decider: {},
    targetStats: createEmptyFactionStats(),
    trendsMap: new Map(),
    trendEloAccum: new Map(),
    analyzedMatches: 0,
    latestGame: 0,
    earliestGame: Infinity,
  }
}

/**
 * Общий pipeline анализа матчей.
 * Один цикл по матчам, 6 шагов + кастомный onMatch callback.
 * Различия между player/team анализом инжектируются через AnalysisConfig.
 */
export function runAnalysisPipeline(
  matchesData: MatchWithData[],
  config: AnalysisConfig,
): AnalysisAccumulator {
  const acc = createAccumulator()

  for (const { match, history, stats: matchStats } of matchesData) {
    if (!match) continue

    if (match.started_at > acc.latestGame) acc.latestGame = match.started_at
    if (match.started_at < acc.earliestGame) acc.earliestGame = match.started_at

    const targetFaction = config.resolveFaction(match)
    if (!targetFaction) continue

    const opponentFaction: FactionKey = targetFaction === "faction1" ? "faction2" : "faction1"
    const won = match.results?.winner === targetFaction

    const monthKey = getMonthKey(match.started_at)
    const trend = getOrCreateTrend(acc.trendsMap, monthKey)

    const ctx: MatchContext = {
      match,
      history,
      matchStats,
      targetFaction,
      opponentFaction,
      won,
      monthKey,
    }

    // Pipeline steps
    processElo(ctx, acc)
    processFavoriteUnderdog(ctx, acc)
    processCompetitionType(ctx, acc)
    processVoting(ctx, acc, trend, config)
    processWinRate(ctx, acc, trend, config)
    processTrendElo(ctx, acc, trend)

    // Кастомная обработка (leader tracking, enemy bans и т.д.)
    config.onMatch?.(ctx, acc, trend)

    trend.matchCount++
  }

  return acc
}
