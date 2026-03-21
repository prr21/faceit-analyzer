import type { AxiosInstance } from "axios"
import type { FaceitMatchDetail, VotingPayload } from "../types/faceit.js"
import { getMatchInfo } from "./faceit-open.js"
import { withCache } from "../utils/cache.js"

const DEMOCRACY_API_URL = "https://www.faceit.com/api/democracy/v1"

export async function getMatchVotingHistory(
  matchId: string,
): Promise<VotingPayload | null> {
  return withCache(`voting:${matchId}`, async () => {
    try {
      const response = await fetch(
        `${DEMOCRACY_API_URL}/match/${matchId}/history`,
      )
      const data = await response.json()
      return data.payload ?? null
    } catch {
      return null
    }
  })
}

export async function getMatchWithVoting(
  client: AxiosInstance,
  matchId: string,
): Promise<{ match: FaceitMatchDetail; history: VotingPayload | null }> {
  const [match, history] = await Promise.all([
    getMatchInfo(client, matchId),
    getMatchVotingHistory(matchId),
  ])
  return { match, history }
}
