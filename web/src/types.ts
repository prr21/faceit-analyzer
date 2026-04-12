import type {
  TeamDropPickStats,
  PlayerDropPickStats,
} from "@faceit/core"

// Re-export domain types from @faceit/core — single source of truth
export type {
  MapCountRecord,
  FactionBanPickStats,
  MapWinRate,
  EloSnapshot,
  FavoriteUnderdogStats,
  CompetitionTypeStats,
  MatchRecord,
  PlayerProfile,
  StreakInfo,
  TrendPeriod,
  TeamDropPickStats,
  PlayerDropPickStats,
} from "@faceit/core"

// Web-specific types

export interface ReportData {
  type: "team" | "player"
  name: string
  stats: TeamDropPickStats | PlayerDropPickStats
}
