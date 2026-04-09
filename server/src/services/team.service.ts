import {
  getPlayerMatches,
  getMatchWithVoting,
  analyzeTeamMapStrategy,
  batchWithLimit,
  DEFAULT_CONCURRENCY,
} from "@faceit/core"
import type { FaceitClient, TeamDropPickStats } from "@faceit/core"
import { AppError } from "../lib/errors"

const MIN_PLAYERS_IN_MATCH = 3

export interface TeamAnalysisResult {
  stats: TeamDropPickStats
  teamName: string
}

export async function getTeamAnalysis(
  client: FaceitClient,
  teamPlayerIds: string[],
  teamName: string,
): Promise<TeamAnalysisResult> {
  if (teamPlayerIds.length === 0) {
    throw AppError.badRequest("Список игроков команды пуст")
  }

  // Собираем матчи всех игроков команды
  const playersMatches = await batchWithLimit(
    teamPlayerIds.map((id) => () => getPlayerMatches(client, id)),
    DEFAULT_CONCURRENCY,
  )
  const allMatches = playersMatches.flat()

  // Фильтруем — только матчи где >= 3 игрока команды
  const matchPlayerCount: Record<string, number> = {}
  for (const match of allMatches) {
    matchPlayerCount[match.match_id] = (matchPlayerCount[match.match_id] || 0) + 1
  }

  const teamMatchIds = Object.keys(matchPlayerCount).filter(
    (id) => matchPlayerCount[id] >= MIN_PLAYERS_IN_MATCH,
  )

  if (teamMatchIds.length === 0) {
    throw AppError.notFound(`Не найдено командных матчей для "${teamName}"`)
  }

  const matchesWithDetail = await batchWithLimit(
    teamMatchIds.map((id) => () => getMatchWithVoting(client, id)),
    DEFAULT_CONCURRENCY,
  )

  const stats = analyzeTeamMapStrategy(matchesWithDetail, teamPlayerIds, teamName)

  return { stats, teamName }
}
