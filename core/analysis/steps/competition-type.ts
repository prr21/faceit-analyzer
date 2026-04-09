import type { MatchContext, AnalysisAccumulator } from "../../types/analysis"
import { trackCompetitionType } from "../helpers/trackers"

/** Трекинг win rate по типу соревнования (matchmaking, tournament и т.д.) */
export function processCompetitionType(ctx: MatchContext, acc: AnalysisAccumulator): void {
  if (!ctx.match.competition_type || !ctx.match.results?.winner) return
  trackCompetitionType(acc.competitionStats, ctx.match.competition_type, ctx.won)
}
