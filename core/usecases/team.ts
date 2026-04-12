import type { FaceitClient } from "../api/client"
import type { TeamDropPickStats } from "../types/index"
import { getPlayerMatches } from "../api/faceit-open"
import { getMatchWithVoting } from "../api/faceit-internal"
import { analyzeTeamMapStrategy } from "../analysis/team-strategy"
import { batchWithLimit } from "../infra/concurrency"
import { DEFAULT_CONCURRENCY } from "../constants"

const DEFAULT_MIN_PLAYERS = 3

export interface TeamAnalysisResult {
  stats: TeamDropPickStats
}

/**
 * Полный пайплайн анализа команды:
 * fetch all players' matches → filter by player count → batch fetch details → analyze
 */
export async function fetchAndAnalyzeTeam(
  client: FaceitClient,
  playerIds: string[],
  teamName: string,
  options?: {
    minPlayers?: number
    onProgress?: (done: number, total: number) => void
  },
): Promise<TeamAnalysisResult> {
  const minPlayers = options?.minPlayers ?? DEFAULT_MIN_PLAYERS

  // Собираем матчи всех игроков команды
  const playersMatches = await batchWithLimit(
    playerIds.map((id) => () => getPlayerMatches(client, id)),
    DEFAULT_CONCURRENCY,
  )
  const allMatches = playersMatches.flat()

  // Фильтруем — только матчи где >= minPlayers игроков команды
  const matchPlayerCount: Record<string, number> = {}
  for (const match of allMatches) {
    matchPlayerCount[match.match_id] = (matchPlayerCount[match.match_id] || 0) + 1
  }

  const teamMatchIds = Object.keys(matchPlayerCount).filter(
    (id) => matchPlayerCount[id] >= minPlayers,
  )

  const matchesWithDetail = await batchWithLimit(
    teamMatchIds.map((id) => () => getMatchWithVoting(client, id)),
    DEFAULT_CONCURRENCY,
    options?.onProgress,
  )

  const stats = analyzeTeamMapStrategy(matchesWithDetail, playerIds, teamName)

  return { stats }
}
