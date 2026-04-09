import {
  getPlayerId,
  getPlayerInfo,
} from "@faceit/core"
import type { FaceitClient, FaceitPlayer } from "@faceit/core"
import { AppError } from "../lib/errors"

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
