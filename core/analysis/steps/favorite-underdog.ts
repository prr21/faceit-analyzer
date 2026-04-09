import type { MatchContext, AnalysisAccumulator } from "../../types/analysis"
import { trackFavoriteUnderdog } from "../helpers/trackers"

/** Трекинг фаворит/андердог по winProbability */
export function processFavoriteUnderdog(ctx: MatchContext, acc: AnalysisAccumulator): void {
  const factionStats = ctx.match.teams[ctx.targetFaction].stats
  if (factionStats?.winProbability === undefined || !ctx.match.results?.winner) return
  trackFavoriteUnderdog(acc.favoriteUnderdog, factionStats.winProbability, ctx.won)
}
