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
}

export interface FaceitTeamFaction {
  leader: string
  players: FaceitFactionPlayer[]
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

export interface TrendPeriod {
  label: string
  stats: FactionBanPickStats
  decider: MapCountRecord
  mapWinRate: Record<string, MapWinRate>
  matchCount: number
}

export interface TeamDropPickStats {
  target: FactionBanPickStats
  enemy: FactionBanPickStats
  decider: MapCountRecord
  mapWinRate: Record<string, MapWinRate>
  trends: TrendPeriod[]
  earliestGame: string
  latestGame: string
  mapInfo: string
  count: number
  allCount: number
}

export interface PlayerDropPickStats {
  bans: MapCountRecord
  play: MapCountRecord
  banFirst: MapCountRecord
}
