import type { FactionBanPickStats, MapWinRate, TrendPeriod } from "../types/faceit.js"

export function createEmptyFactionStats(): FactionBanPickStats {
  return { firstBan: {}, firstPick: {}, secondBan: {}, thirdBan: {} }
}

export function trackWinRate(record: Record<string, MapWinRate>, mapName: string, won: boolean): void {
  if (!record[mapName]) record[mapName] = { wins: 0, losses: 0, total: 0, rate: 0 }
  const entry = record[mapName]
  if (won) entry.wins++
  else entry.losses++
  entry.total++
  entry.rate = Math.round((entry.wins / entry.total) * 100)
}

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
    }
    trendsMap.set(key, trend)
  }
  return trend
}
