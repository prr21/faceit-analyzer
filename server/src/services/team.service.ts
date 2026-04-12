import { fetchAndAnalyzeTeam } from "@faceit/core"
import type { FaceitClient, TeamAnalysisResult } from "@faceit/core"
import { AppError } from "../lib/errors"

export type { TeamAnalysisResult }

export async function getTeamAnalysis(
  client: FaceitClient,
  teamPlayerIds: string[],
  teamName: string,
): Promise<TeamAnalysisResult> {
  if (teamPlayerIds.length === 0) {
    throw AppError.badRequest("Список игроков команды пуст")
  }

  try {
    return await fetchAndAnalyzeTeam(client, teamPlayerIds, teamName)
  } catch {
    throw AppError.notFound(`Не найдено командных матчей для "${teamName}"`)
  }
}
