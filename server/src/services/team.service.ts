import { fetchAndAnalyzeTeam, getTeamInfo } from "@faceit/core"
import type { FaceitClient, TeamAnalysisResult, TeamInfo } from "@faceit/core"
import { AppError, upstreamStatus } from "../lib/errors"

export type { TeamAnalysisResult }

export async function getTeamRoster(
  client: FaceitClient,
  teamId: string,
): Promise<TeamInfo> {
  if (!teamId || typeof teamId !== "string") {
    throw AppError.badRequest("teamId обязателен")
  }

  const info = await getTeamInfo(client, teamId)
  if (!info) {
    throw AppError.notFound(`Команда ${teamId} не найдена`)
  }
  return info
}

export async function getTeamAnalysis(
  client: FaceitClient,
  teamPlayerIds: string[],
  teamName: string,
): Promise<TeamAnalysisResult> {
  if (teamPlayerIds.length === 0) {
    throw AppError.badRequest("Список игроков команды пуст")
  }

  const minPlayers = Math.min(3, teamPlayerIds.length)

  let result: TeamAnalysisResult
  try {
    result = await fetchAndAnalyzeTeam(client, teamPlayerIds, teamName, {
      minPlayers,
    })
  } catch (err) {
    // 404 от FACEIT = несуществующий player_id в запросе; остальное пробрасываем
    if (upstreamStatus(err) === 404) {
      throw AppError.badRequest("Один из playerIds не найден в FACEIT")
    }
    throw err
  }

  if (result.stats.count === 0) {
    throw AppError.notFound(`Не найдено командных матчей для "${teamName}"`)
  }
  return result
}
