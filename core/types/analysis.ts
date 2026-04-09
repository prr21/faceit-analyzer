import type {
  FaceitMatchDetail,
  FaceitMatchStats,
  VotingPayload,
  VotingEntity,
} from "./api"
import type {
  EloSnapshot,
  FavoriteUnderdogStats,
  CompetitionTypeStats,
  MapWinRate,
  MatchRecord,
  MapCountRecord,
  FactionBanPickStats,
  TrendPeriod,
} from "./domain"

export type VotingPhase =
  | "firstBan"
  | "firstPick"
  | "secondBan"
  | "thirdBan"
  | "decider"

export type FactionKey = "faction1" | "faction2"

export interface MatchWithData {
  match: FaceitMatchDetail
  history: VotingPayload | null
  stats: FaceitMatchStats | null
}

export interface MatchContext {
  match: FaceitMatchDetail
  history: VotingPayload | null
  matchStats: FaceitMatchStats | null
  targetFaction: FactionKey
  opponentFaction: FactionKey
  won: boolean
  monthKey: string
}

export type BanPickPhase = Exclude<VotingPhase, "decider">

export type VotingEntityHandler = (
  entity: VotingEntity,
  phase: BanPickPhase,
  targetFaction: FactionKey,
  acc: AnalysisAccumulator,
  trend: TrendPeriod,
) => void

export interface AnalysisConfig {
  resolveFaction: (match: FaceitMatchDetail) => FactionKey | null
  shouldProcessVoting: (match: FaceitMatchDetail, targetFaction: FactionKey) => boolean
  processVotingEntity: VotingEntityHandler
  playerId?: string
  onMatch?: (ctx: MatchContext, acc: AnalysisAccumulator, trend: TrendPeriod) => void
}

export interface AnalysisAccumulator {
  eloHistory: EloSnapshot[]
  eloSum: number
  eloCount: number
  favoriteUnderdog: FavoriteUnderdogStats
  competitionStats: CompetitionTypeStats
  mapWinRate: Record<string, MapWinRate>
  deciderWinRate: Record<string, MapWinRate>
  matchRecords: Record<string, MatchRecord[]>
  decider: MapCountRecord
  targetStats: FactionBanPickStats
  trendsMap: Map<string, TrendPeriod>
  trendEloAccum: Map<string, { sum: number; count: number }>
  analyzedMatches: number
  latestGame: number
  earliestGame: number
}
