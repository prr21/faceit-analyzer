import type { TrendPeriod } from "../../types/index"
import type { MatchContext, AnalysisAccumulator, AnalysisConfig, BanPickPhase } from "../../types/analysis"
import {
  findMapVotingTicket,
  isPoolMap,
  classifyVotingEntity,
  getDeciderRound,
} from "../helpers/map-voting"
import { incrementMapCount } from "../helpers/trackers"
import { trackWinRate } from "../helpers/trackers"

/** Обработка map veto: баны, пики, десайдеры */
export function processVoting(
  ctx: MatchContext,
  acc: AnalysisAccumulator,
  trend: TrendPeriod,
  config: AnalysisConfig,
): void {
  if (!config.shouldProcessVoting(ctx.match, ctx.targetFaction)) return
  if (!ctx.history) return

  const mapVoting = findMapVotingTicket(ctx.history)
  if (!mapVoting) return

  const deciderRound = getDeciderRound(mapVoting)

  for (const entity of mapVoting.entities) {
    if (!isPoolMap(entity.guid)) continue

    const phase = classifyVotingEntity(entity, deciderRound)
    if (!phase) continue

    if (phase === "decider") {
      incrementMapCount(acc.decider, entity.guid)
      incrementMapCount(trend.decider, entity.guid)
      if (ctx.match.results?.winner) {
        trackWinRate(acc.deciderWinRate, entity.guid, ctx.won)
      }
      continue
    }

    config.processVotingEntity(entity, phase as BanPickPhase, ctx.targetFaction, acc, trend)
  }

  acc.analyzedMatches++
}
