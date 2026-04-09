// Domain types

export type MapCountRecord = Record<string, number>

export interface FactionBanPickStats {
  firstBan: MapCountRecord
  firstPick: MapCountRecord
  secondBan: MapCountRecord
  thirdBan: MapCountRecord
}

export interface MapWinRate {
  wins: number
  losses: number
  total: number
  rate: number
}

export interface EloSnapshot {
  date: number
  elo: number
  result: "win" | "loss"
  matchId?: string
}

export interface FavoriteUnderdogStats {
  asFavorite: MapWinRate
  asUnderdog: MapWinRate
}

export interface CompetitionTypeStats {
  [type: string]: MapWinRate
}

export interface MatchRecord {
  matchId: string
  date: number
  faceitUrl: string
  won: boolean
  mapScore: string
  matchScore?: string
  bestOf: number
  opponentName: string
  opponentTeamUrl?: string
  targetRating?: number
  opponentRating?: number
  competitionName?: string
  competitionUrl?: string
  kills?: number
  deaths?: number
  assists?: number
  headshots?: number
  headshotPercent?: number
  adr?: number
  kr?: number
  kdRatio?: number
  eloChange?: number
}

export interface PlayerProfile {
  nickname: string
  avatar?: string
  skillLevel: number
  currentElo: number
  country?: string
}

export interface StreakInfo {
  type: "win" | "loss"
  count: number
}

export interface TrendPeriod {
  label: string
  stats: FactionBanPickStats
  decider: MapCountRecord
  mapWinRate: Record<string, MapWinRate>
  matchCount: number
  avgElo: number
  leaderMapWinRate: Record<string, MapWinRate>
  leaderMatchCount: number
}

export interface TeamDropPickStats {
  target: FactionBanPickStats
  enemy: FactionBanPickStats
  decider: MapCountRecord
  mapWinRate: Record<string, MapWinRate>
  deciderWinRate: Record<string, MapWinRate>
  eloHistory: EloSnapshot[]
  favoriteUnderdog: FavoriteUnderdogStats
  competitionStats: CompetitionTypeStats
  matchRecords: Record<string, MatchRecord[]>
  avgElo: number
  trends: TrendPeriod[]
  earliestGame: string
  latestGame: string
  mapInfo: string
  count: number
  allCount: number
}

export interface PlayerDropPickStats {
  stats: FactionBanPickStats
  decider: MapCountRecord
  mapWinRate: Record<string, MapWinRate>
  deciderWinRate: Record<string, MapWinRate>
  eloHistory: EloSnapshot[]
  favoriteUnderdog: FavoriteUnderdogStats
  competitionStats: CompetitionTypeStats
  matchRecords: Record<string, MatchRecord[]>
  leaderMapWinRate: Record<string, MapWinRate>
  leaderMatchRecords: Record<string, MatchRecord[]>
  avgElo: number
  trends: TrendPeriod[]
  earliestGame: string
  latestGame: string
  mapInfo: string
  count: number
  allCount: number
  playerProfile?: PlayerProfile
  longestWinStreak?: number
  currentStreak?: StreakInfo
}
