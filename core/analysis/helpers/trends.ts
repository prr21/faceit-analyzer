import type { TrendPeriod } from "../../types/index"
import { createEmptyFactionStats } from "./factories"

export function getMonthKey(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function getOrCreateTrend(trendsMap: Map<string, TrendPeriod>, key: string): TrendPeriod {
  let trend = trendsMap.get(key)
  if (!trend) {
    trend = {
      label: key,
      stats: createEmptyFactionStats(),
      decider: {},
      mapWinRate: {},
      matchCount: 0,
      leaderMapWinRate: {},
      leaderMatchCount: 0,
    }
    trendsMap.set(key, trend)
  }
  return trend
}
