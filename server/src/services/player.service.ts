import {
  getPlayerId,
  getPlayerInfo,
  getPlayerMatches,
  getMatchWithVoting,
  analyzePlayerMapStrategy,
  batchWithLimit,
  DEFAULT_CONCURRENCY,
} from "@faceit/core"
import type { FaceitClient, PlayerDropPickStats, FaceitPlayer } from "@faceit/core"
import { AppError } from "../lib/errors"

export interface PlayerAnalysisResult {
  stats: PlayerDropPickStats
  playerInfo: FaceitPlayer | null
}

export async function getPlayerAnalysis(
  client: FaceitClient,
  nickname: string,
): Promise<PlayerAnalysisResult> {
  let playerId: string
  try {
    playerId = await getPlayerId(client, nickname)
  } catch {
    throw AppError.notFound(`Игрок "${nickname}" не найден`)
  }

  const [playerInfo, matches] = await Promise.all([
    getPlayerInfo(client, playerId),
    getPlayerMatches(client, playerId),
  ])

  if (matches.length === 0) {
    throw AppError.notFound(`У игрока "${nickname}" нет матчей`)
  }

  const matchesData = await batchWithLimit(
    matches.map((m) => () => getMatchWithVoting(client, m.match_id)),
    DEFAULT_CONCURRENCY,
  )

  const stats = analyzePlayerMapStrategy(matchesData, playerId, nickname)

  // Заполняем профиль (как в CLI)
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
