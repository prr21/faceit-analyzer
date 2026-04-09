import type { TrendPeriod } from "../../types/index"
import type { MatchContext, AnalysisAccumulator } from "../../types/analysis"

/** Инкрементальный расчёт avgElo для тренда — O(1) на матч вместо O(n) */
export function processTrendElo(
  ctx: MatchContext,
  acc: AnalysisAccumulator,
  trend: TrendPeriod,
): void {
  const factionStats = ctx.match.teams[ctx.targetFaction].stats
  if (!factionStats?.rating) return

  const existing = acc.trendEloAccum.get(ctx.monthKey) ?? { sum: 0, count: 0 }
  existing.sum += factionStats.rating
  existing.count++
  acc.trendEloAccum.set(ctx.monthKey, existing)

  trend.avgElo = Math.round(existing.sum / existing.count)
}
