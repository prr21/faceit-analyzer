import { fetchAndAnalyzePlayer } from "@faceit/core"
import type { FaceitClient, PlayerAnalysisResult } from "@faceit/core"
import { AppError, upstreamStatus } from "../lib/errors"

export type { PlayerAnalysisResult }

export async function getPlayerAnalysis(
  client: FaceitClient,
  nickname: string,
): Promise<PlayerAnalysisResult> {
  try {
    return await fetchAndAnalyzePlayer(client, nickname)
  } catch (err) {
    // 404 от FACEIT = такого никнейма нет; остальное — не наша зона, пробрасываем
    if (upstreamStatus(err) === 404) {
      throw AppError.notFound(`Игрок "${nickname}" не найден`)
    }
    throw err
  }
}
