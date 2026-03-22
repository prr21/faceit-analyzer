import type { AxiosInstance } from "axios"
import type { FaceitMatchDetail, VotingPayload } from "../types/faceit.js"
import { getMatchInfo } from "./faceit-open.js"
import { withCache } from "../utils/cache.js"
import { withRetry } from "../utils/retry.js"

const DEMOCRACY_API_URL = "https://www.faceit.com/api/democracy/v1"

export async function getMatchVotingHistory(
  matchId: string,
): Promise<VotingPayload | null> {
  return withCache(`voting:${matchId}`, async () => {
    try {
      return await withRetry(async () => {
        const response = await fetch(
          `${DEMOCRACY_API_URL}/match/${matchId}/history`,
        )
        if (!response.ok) {
          const err: any = new Error(`HTTP ${response.status}`)
          err.status = response.status
          throw err
        }
        const data = await response.json()
        return data.payload ?? null
      })
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
