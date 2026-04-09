import type { TrendPeriod } from "../../types/index"
import type { MatchContext, AnalysisAccumulator, AnalysisConfig } from "../../types/analysis"
import { isPoolMap } from "../helpers/map-voting"
import { trackWinRate } from "../helpers/trackers"
import { buildMatchRecord, addMatchRecord } from "../helpers/match-record"

/** Трекинг win rate по картам + создание match records */
export function processWinRate(
  ctx: MatchContext,
  acc: AnalysisAccumulator,
  trend: TrendPeriod,
  config: AnalysisConfig,
): void {
  const playedMaps = ctx.match.voting?.map?.pick || []
  if (!ctx.match.results?.winner || playedMaps.length === 0) return

  if (ctx.match.detailed_results && ctx.match.detailed_results.length > 0) {
    const playedCount = Math.min(playedMaps.length, ctx.match.detailed_results.length)
    for (let i = 0; i < playedCount; i++) {
      if (!isPoolMap(playedMaps[i])) continue
      const mapWon = ctx.match.detailed_results[i].winner === ctx.targetFaction
      trackWinRate(acc.mapWinRate, playedMaps[i], mapWon)
      trackWinRate(trend.mapWinRate, playedMaps[i], mapWon)
      const record = buildMatchRecord(
        ctx.match, ctx.targetFaction, playedMaps[i], i, mapWon,
        ctx.matchStats, config.playerId,
      )
      addMatchRecord(acc.matchRecords, playedMaps[i], record)
    }
  } else {
    for (let i = 0; i < playedMaps.length; i++) {
      const mapName = playedMaps[i]
      if (!isPoolMap(mapName)) continue
      trackWinRate(acc.mapWinRate, mapName, ctx.won)
      trackWinRate(trend.mapWinRate, mapName, ctx.won)
      const record = buildMatchRecord(
        ctx.match, ctx.targetFaction, mapName, i, ctx.won,
        ctx.matchStats, config.playerId,
      )
      addMatchRecord(acc.matchRecords, mapName, record)
    }
  }
}
