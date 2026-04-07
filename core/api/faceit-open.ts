import type { AxiosInstance } from "axios"
import { DEFAULT_GAME, DEFAULT_MATCH_LIMIT } from "../constants.js"
import { withCache } from "../utils/cache.js"
import { withRetry } from "../utils/retry.js"
import type { FaceitMatch, FaceitMatchDetail, FaceitMatchStats, FaceitPlayer } from "../types/faceit.js"

export async function getPlayerId(
  client: AxiosInstance,
  nickname: string,
): Promise<string> {
  return withRetry(async () => {
    const response = await client.get("/players", { params: { nickname } })
    return response.data.player_id
  })
}

export async function getPlayerMatches(
  client: AxiosInstance,
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
  client: AxiosInstance,
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
  client: AxiosInstance,
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
  client: AxiosInstance,
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

export async function getPlayerInfo(
  client: AxiosInstance,
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
