import type { FactionBanPickStats, FavoriteUnderdogStats } from "../../types/index"

export function createEmptyFactionStats(): FactionBanPickStats {
  return { firstBan: {}, firstPick: {}, secondBan: {}, thirdBan: {} }
}

export function createEmptyFavoriteUnderdog(): FavoriteUnderdogStats {
  return {
    asFavorite: { wins: 0, losses: 0, total: 0, rate: 0 },
    asUnderdog: { wins: 0, losses: 0, total: 0, rate: 0 },
  }
}
