import {
  getPlayerId,
  getPlayerInfo,
  searchPlayers,
  searchTeams,
} from "@faceit/core"
import type {
  FaceitClient,
  FaceitPlayer,
  SearchPlayerResult,
  SearchTeamResult,
} from "@faceit/core"
import { AppError } from "../lib/errors"

export interface SearchAllResult {
  players: SearchPlayerResult[]
  teams: SearchTeamResult[]
}

export async function searchAll(
  client: FaceitClient,
  query: string,
): Promise<SearchAllResult> {
  if (!query || query.length < 2) {
    throw AppError.badRequest("Параметр q должен быть строкой длиной >= 2")
  }
  const [players, teams] = await Promise.all([
    searchPlayers(client, query),
    searchTeams(client, query),
  ])
  return { players, teams }
}

export async function searchPlayer(
  client: FaceitClient,
  nickname: string,
): Promise<FaceitPlayer> {
  if (!nickname || nickname.length < 2) {
    throw AppError.badRequest("Nickname должен быть не менее 2 символов")
  }

  let playerId: string
  try {
    playerId = await getPlayerId(client, nickname)
  } catch {
    throw AppError.notFound(`Игрок "${nickname}" не найден`)
  }

  const info = await getPlayerInfo(client, playerId)
  if (!info) {
    throw AppError.notFound(`Не удалось получить профиль игрока "${nickname}"`)
  }

  return info
}
