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
  faceit_url: string
  teams: {
    faction1: { players: FaceitFactionPlayer[] }
    faction2: { players: FaceitFactionPlayer[] }
  }
  results?: { winner: string }
}

export interface FaceitMatchDetail {
  match_id: string
  started_at: number
  teams: {
    faction1: FaceitTeamFaction
    faction2: FaceitTeamFaction
  }
  results?: { winner: string }
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

export interface TeamDropPickStats {
  target: FactionBanPickStats
  enemy: FactionBanPickStats
  decider: MapCountRecord
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
