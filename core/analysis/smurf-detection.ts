import type { FaceitFactionPlayer, FaceitMatch, FaceitPlayer } from "../types/faceit.js"
import { replaceLangPlaceholder } from "../utils/dedup.js"

export interface SmurfDetectionResult {
  /** URL смурфа → список URL матчей, где он встречался */
  matchesBySmurf: Record<string, string[]>
  /** Список найденных смурфов */
  smurfs: FaceitPlayer[]
}

export function collectEnemyPlayers(
  matches: FaceitMatch[],
  playerId: string,
): {
  enemies: FaceitFactionPlayer[]
  matchesByPlayerUrl: Record<string, string[]>
} {
  const matchesByPlayerUrl: Record<string, string[]> = {}

  const enemies = matches.reduce<FaceitFactionPlayer[]>((acc, match) => {
    const playerInFaction1 = match.teams.faction1.players.some(
      p => p.player_id === playerId,
    )
    const playerFaction = playerInFaction1 ? "faction1" : "faction2"
    const enemyFaction = playerInFaction1 ? "faction2" : "faction1"

    if (match.results?.winner === playerFaction) {
      return acc
    }

    const enemyPlayers = match.teams[enemyFaction].players

    for (const player of enemyPlayers) {
      const playerUrl = replaceLangPlaceholder(player.faceit_url)
      const matchUrl = replaceLangPlaceholder(match.faceit_url)
      const existing = matchesByPlayerUrl[playerUrl] || []
      matchesByPlayerUrl[playerUrl] = existing.concat(matchUrl)
    }

    return acc.concat(enemyPlayers)
  }, [])

  return { enemies, matchesByPlayerUrl }
}

export function filterSmurfs(
  playerInfos: (FaceitPlayer | null)[],
  matchesByPlayerUrl: Record<string, string[]>,
  game: string,
  eloThreshold: number,
): SmurfDetectionResult {
  const smurfs = (playerInfos.filter(Boolean) as FaceitPlayer[]).filter(
    player => player.games[game]?.faceit_elo < eloThreshold,
  )

  const matchesBySmurf: Record<string, string[]> = {}
  for (const smurf of smurfs) {
    const smurfUrl = replaceLangPlaceholder(smurf.faceit_url)
    matchesBySmurf[smurfUrl] = matchesByPlayerUrl[smurfUrl]
  }

  return { matchesBySmurf, smurfs }
}
