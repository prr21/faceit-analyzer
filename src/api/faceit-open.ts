import type { AxiosInstance } from "axios"
import { DEFAULT_GAME, DEFAULT_MATCH_LIMIT } from "../config.js"
import type { FaceitMatch, FaceitMatchDetail, FaceitPlayer } from "../types/faceit.js"

export async function getPlayerId(
  client: AxiosInstance,
  nickname: string,
): Promise<string> {
  const response = await client.get("/players", { params: { nickname } })
  return response.data.player_id
}

export async function getPlayerMatches(
  client: AxiosInstance,
  playerId: string,
  limit: number = DEFAULT_MATCH_LIMIT,
): Promise<FaceitMatch[]> {
  const response = await client.get(`/players/${playerId}/history`, {
    params: { game: DEFAULT_GAME, offset: 0, limit },
  })
  return response.data.items || []
}

export async function getMatchInfo(
  client: AxiosInstance,
  matchId: string,
): Promise<FaceitMatchDetail> {
  const response = await client.get(`/matches/${matchId}`)
  return response.data
}

export async function getPlayerInfo(
  client: AxiosInstance,
  playerId: string,
): Promise<FaceitPlayer | null> {
  try {
    const response = await client.get(`/players/${playerId}`)
    return response.data
  } catch {
    return null
  }
}
