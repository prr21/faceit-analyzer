// FACEIT Open Data API types

export interface FaceitPlayer {
  player_id: string
  nickname: string
  faceit_url: string
  avatar?: string
  country?: string
  steam_id_64?: string
  games: Record<string, { faceit_elo: number; skill_level?: number }>
}

// Match Stats API types (GET /matches/{id}/stats)

export interface FaceitMatchStatsPlayer {
  player_id: string
  nickname: string
  player_stats: Record<string, string>
}

export interface FaceitMatchStatsTeam {
  team_id: string
  players: FaceitMatchStatsPlayer[]
}

export interface FaceitMatchStatsRound {
  round_stats: Record<string, string>
  teams: FaceitMatchStatsTeam[]
}

export interface FaceitMatchStats {
  rounds: FaceitMatchStatsRound[]
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
  faction_id?: string
  leader: string
  roster?: FaceitFactionPlayer[]
  players?: FaceitFactionPlayer[]
  stats?: FaceitFactionStats
  name?: string
  type?: string
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
  competition_id?: string
  competition_type?: string
  competition_name?: string
  faceit_url?: string
  demo_url?: string[]
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

// Aggregated player stats (GET /players/{id}/stats/{game})

export interface FaceitStatsSegment {
  type: string // "Map"
  mode: string // "5v5", "Wingman"
  label: string // "Nuke", "Mirage" — без префикса de_
  img?: string
  stats: Record<string, string>
}

export interface FaceitPlayerGameStats {
  player_id: string
  game_id: string
  lifetime?: Record<string, string | string[]>
  segments?: FaceitStatsSegment[]
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
