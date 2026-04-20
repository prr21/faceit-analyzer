import { fetchAndAnalyzeTeam, getTeamInfo } from "@faceit/core"
import type { FaceitClient, TeamAnalysisResult, TeamInfo } from "@faceit/core"
import { AppError } from "../lib/errors"

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

  try {
    return await fetchAndAnalyzeTeam(client, teamPlayerIds, teamName, {
      minPlayers,
    })
  } catch {
    throw AppError.notFound(`Не найдено командных матчей для "${teamName}"`)
  }
}
