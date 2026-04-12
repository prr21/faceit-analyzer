import type { FaceitClient } from "../api/client"
import type { PlayerDropPickStats, FaceitPlayer } from "../types/index"
import { getPlayerId, getPlayerInfo, getPlayerMatches } from "../api/faceit-open"
import { getMatchWithVoting } from "../api/faceit-internal"
import { analyzePlayerMapStrategy } from "../analysis/player-strategy"
import { batchWithLimit } from "../infra/concurrency"
import { DEFAULT_CONCURRENCY } from "../constants"

export interface PlayerAnalysisResult {
  stats: PlayerDropPickStats
  playerInfo: FaceitPlayer | null
}

/**
 * Полный пайплайн анализа игрока:
 * resolve ID → fetch info + matches → batch fetch details → analyze → fill profile
 */
export async function fetchAndAnalyzePlayer(
  client: FaceitClient,
  nickname: string,
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<PlayerAnalysisResult> {
  const playerId = await getPlayerId(client, nickname)

  const [playerInfo, matches] = await Promise.all([
    getPlayerInfo(client, playerId),
    getPlayerMatches(client, playerId),
  ])

  const matchesData = await batchWithLimit(
    matches.map((m) => () => getMatchWithVoting(client, m.match_id)),
    DEFAULT_CONCURRENCY,
    options?.onProgress,
  )

  const stats = analyzePlayerMapStrategy(matchesData, playerId, nickname)

  if (playerInfo) {
    const cs2 = playerInfo.games?.cs2
    stats.playerProfile = {
      nickname: playerInfo.nickname,
      avatar: playerInfo.avatar,
      skillLevel: cs2?.skill_level ?? 0,
      currentElo: cs2?.faceit_elo ?? 0,
      country: playerInfo.country,
    }
  }

  return { stats, playerInfo }
}
