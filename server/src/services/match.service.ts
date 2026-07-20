import { fetchAndAnalyzeMatch, parseMatchId } from "@faceit/core"
import type { FaceitClient, MatchAnalysisResult } from "@faceit/core"
import { AppError, upstreamStatus } from "../lib/errors"

export type { MatchAnalysisResult }

const MATCH_ID_RE = /^1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getMatchAnalysis(
  client: FaceitClient,
  matchIdOrUrl: string,
): Promise<MatchAnalysisResult> {
  const matchId = parseMatchId(matchIdOrUrl)
  if (!MATCH_ID_RE.test(matchId)) {
    throw AppError.badRequest("Некорректный id матча — ожидается формат 1-<uuid>")
  }

  try {
    return await fetchAndAnalyzeMatch(client, matchId)
  } catch (err) {
    if (upstreamStatus(err) === 404) {
      throw AppError.notFound(`Матч ${matchId} не найден`)
    }
    throw err
  }
}
