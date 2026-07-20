import type { FaceitClient } from "./client"
import { DEFAULT_GAME, DEFAULT_MATCH_LIMIT } from "../constants"
import { withCache } from "../infra/cache"
import { withRetry } from "../infra/retry"
import type {
  FaceitMatch,
  FaceitMatchDetail,
  FaceitMatchStats,
  FaceitPlayer,
  FaceitPlayerGameStats,
} from "../types/index"

export interface SearchPlayerResult {
  player_id: string
  nickname: string
  avatar: string
  country: string
  skill_level: number
}

export interface SearchTeamResult {
  team_id: string
  name: string
  avatar: string
  verified: boolean
}

export interface TeamMember {
  player_id: string
  nickname: string
  avatar: string
  country: string
  skill_level: number
}

export interface TeamInfo {
  team_id: string
  name: string
  avatar: string
  members: TeamMember[]
}

export async function searchPlayers(
  client: FaceitClient,
  query: string,
  limit: number = 5,
): Promise<SearchPlayerResult[]> {
  return withRetry(async () => {
    const response = await client.get("/search/players", {
      params: { nickname: query, game: DEFAULT_GAME, limit },
    })
    const items = response.data.items || []
    return items.map((item: any) => ({
      player_id: item.player_id,
      nickname: item.nickname,
      avatar: item.avatar || "",
      country: item.country || "",
      skill_level: item.games?.[DEFAULT_GAME]?.skill_level ?? 0,
    }))
  })
}

export async function searchTeams(
  client: FaceitClient,
  query: string,
  limit: number = 5,
): Promise<SearchTeamResult[]> {
  return withRetry(async () => {
    const response = await client.get("/search/teams", {
      params: { nickname: query, game: DEFAULT_GAME, limit },
    })
    const items = response.data.items || []
    return items.map((item: any) => ({
      team_id: item.team_id,
      name: item.name,
      avatar: item.avatar || "",
      verified: Boolean(item.verified),
    }))
  })
}

export async function getTeamInfo(
  client: FaceitClient,
  teamId: string,
): Promise<TeamInfo | null> {
  try {
    return await withRetry(async () => {
      const response = await client.get(`/teams/${teamId}`)
      const data = response.data
      const members = Array.isArray(data.members) ? data.members : []
      return {
        team_id: data.team_id,
        name: data.name,
        avatar: data.avatar || "",
        members: members.map((m: any) => ({
          player_id: m.user_id ?? m.player_id,
          nickname: m.nickname,
          avatar: m.avatar || "",
          country: m.country || "",
          skill_level: m.game_skill_level ?? m.games?.[DEFAULT_GAME]?.skill_level ?? 0,
        })),
      }
    })
  } catch {
    return null
  }
}

export async function getPlayerId(
  client: FaceitClient,
  nickname: string,
): Promise<string> {
  return withRetry(async () => {
    const response = await client.get("/players", { params: { nickname } })
    return response.data.player_id
  })
}

export async function getPlayerMatches(
  client: FaceitClient,
  playerId: string,
  options: { limit?: number; from?: number; to?: number } = {},
): Promise<FaceitMatch[]> {
  const { limit = DEFAULT_MATCH_LIMIT, from, to } = options
  const params: Record<string, any> = { game: DEFAULT_GAME, offset: 0, limit }
  if (from !== undefined) params.from = from
  if (to !== undefined) params.to = to

  return withRetry(async () => {
    const response = await client.get(`/players/${playerId}/history`, { params })
    return response.data.items || []
  })
}

export async function getAllPlayerMatches(
  client: FaceitClient,
  playerId: string,
): Promise<FaceitMatch[]> {
  const PAGE_SIZE = 100
  const allMatches: FaceitMatch[] = []
  let to: number | undefined

  while (true) {
    const batch = await getPlayerMatches(client, playerId, { limit: PAGE_SIZE, to })
    if (batch.length === 0) break
    allMatches.push(...batch)
    if (batch.length < PAGE_SIZE) break
    // Следующая страница: матчи строго ДО самого раннего в текущей порции
    const newTo = Math.min(...batch.map(m => m.started_at)) - 1
    if (to !== undefined && newTo >= to) break // защита от бесконечного цикла
    to = newTo
  }
  return allMatches
}

export async function getMatchInfo(
  client: FaceitClient,
  matchId: string,
): Promise<FaceitMatchDetail> {
  return withCache(`match:${matchId}`, () =>
    withRetry(async () => {
      const response = await client.get(`/matches/${matchId}`)
      return response.data
    }),
  )
}

export async function getMatchStats(
  client: FaceitClient,
  matchId: string,
): Promise<FaceitMatchStats | null> {
  return withCache(`matchstats:${matchId}`, async () => {
    try {
      return await withRetry(async () => {
        const response = await client.get(`/matches/${matchId}/stats`)
        return response.data
      })
    } catch {
      return null
    }
  })
}

export async function getPlayerMapStats(
  client: FaceitClient,
  playerId: string,
): Promise<FaceitPlayerGameStats | null> {
  try {
    return await withRetry(async () => {
      const response = await client.get(`/players/${playerId}/stats/${DEFAULT_GAME}`)
      return response.data
    })
  } catch {
    return null
  }
}

export async function getPlayerInfo(
  client: FaceitClient,
  playerId: string,
): Promise<FaceitPlayer | null> {
  try {
    return await withRetry(async () => {
      const response = await client.get(`/players/${playerId}`)
      return response.data
    })
  } catch {
    return null
  }
}
