import { fetchAndAnalyzePlayer } from "@faceit/core"
import type { FaceitClient, PlayerAnalysisResult } from "@faceit/core"
import { AppError } from "../lib/errors"

export type { PlayerAnalysisResult }

export async function getPlayerAnalysis(
  client: FaceitClient,
  nickname: string,
): Promise<PlayerAnalysisResult> {
  try {
    return await fetchAndAnalyzePlayer(client, nickname)
  } catch {
    throw AppError.notFound(`Игрок "${nickname}" не найден`)
  }
}
