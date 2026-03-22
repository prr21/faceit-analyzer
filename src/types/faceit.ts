// FACEIT Open Data API types

export interface FaceitPlayer {
  player_id: string
  nickname: string
  faceit_url: string
  games: Record<string, { faceit_elo: number }>
}

export interface FaceitFactionPlayer {
  player_id: string
  nickname: string
  faceit_url: string
  game_skill_level?: number
}

export interface FaceitFactionStats {
  winProbability?: number
  skillLevel?: { average: number; range: { min: number; max: number } }
  rating?: number
}

export interface FaceitTeamFaction {
  leader: string
  players: FaceitFactionPlayer[]
  stats?: FaceitFactionStats
  name?: string
}

export interface FaceitMatch {
  match_id: string
  started_at: number
  faceit_url: string
  teams: {
    faction1: { players: FaceitFactionPlayer[] }
    faction2: { players: FaceitFactionPlayer[] }
  }
  results?: { winner: string }
}

export interface FaceitMatchDetailResult {
  winner: string
  factions: Record<string, { score: number }>
}

export interface FaceitMatchDetail {
  match_id: string
  started_at: number
  best_of: number
  competition_type?: string
  competition_name?: string
  faceit_url?: string
  teams: {
    faction1: FaceitTeamFaction
    faction2: FaceitTeamFaction
  }
  results?: {
    winner: string
    score: Record<string, number>
  }
  detailed_results?: FaceitMatchDetailResult[]
  voting?: { map: { pick: string[] } }
}

// FACEIT Internal Democracy API types

export interface VotingEntity {
  guid: string
  status: "drop" | "pick"
  selected_by: "faction1" | "faction2"
  round: number
}

export interface VotingTicket {
  entity_type: string
  entities: VotingEntity[]
}

export interface VotingPayload {
  tickets: VotingTicket[]
}

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
  targetRating?: number
  opponentRating?: number
  competitionName?: string
}

export interface TrendPeriod {
  label: string
  stats: FactionBanPickStats
  decider: MapCountRecord
  mapWinRate: Record<string, MapWinRate>
  matchCount: number
  avgElo: number
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
  avgElo: number
  trends: TrendPeriod[]
  earliestGame: string
  latestGame: string
  mapInfo: string
  count: number
  allCount: number
}
