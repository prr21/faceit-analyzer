import type { MatchContext, AnalysisAccumulator } from "../../types/analysis"

/** Трекинг ELO: push в eloHistory, сумма и счётчик для среднего */
export function processElo(ctx: MatchContext, acc: AnalysisAccumulator): void {
  const factionStats = ctx.match.teams[ctx.targetFaction].stats
  if (!factionStats?.rating) return

  acc.eloHistory.push({
    date: ctx.match.started_at,
    elo: factionStats.rating,
    result: ctx.won ? "win" : "loss",
    matchId: ctx.match.match_id,
  })
  acc.eloSum += factionStats.rating
  acc.eloCount++
}
