import { FACEIT_API_KEY, DEFAULT_GAME, DEFAULT_CONCURRENCY } from "../config.js"
import { createFaceitClient } from "../api/client.js"
import { getPlayerId, getPlayerMatches, getPlayerInfo } from "../api/faceit-open.js"
import { batchWithLimit } from "../utils/concurrency.js"
import { uniqueByField, replaceLangPlaceholder } from "../utils/dedup.js"
import type { FaceitFactionPlayer, FaceitMatch, FaceitPlayer } from "../types/faceit.js"

const SMURF_ELO_THRESHOLD = 1300
const PLAYER_NICKNAME = process.argv[2] || "ed1v9k"

const client = createFaceitClient(FACEIT_API_KEY)

async function findSmurfs() {
  const playerId = await getPlayerId(client, PLAYER_NICKNAME)
  const matches = await getPlayerMatches(client, playerId)

  const matchesByPlayerUrl: Record<string, string[]> = {}

  // Собираем вражеских игроков из проигранных матчей
  const enemyPlayers = matches.reduce<FaceitFactionPlayer[]>((acc, match) => {
    const playerInFaction1 = match.teams.faction1.players.some(
      p => p.player_id === playerId,
    )
    const playerFaction = playerInFaction1 ? "faction1" : "faction2"
    const enemyFaction = playerInFaction1 ? "faction2" : "faction1"

    if (match.results?.winner === playerFaction) {
      return acc
    }

    const enemies = match.teams[enemyFaction].players

    for (const player of enemies) {
      const playerUrl = replaceLangPlaceholder(player.faceit_url)
      const matchUrl = replaceLangPlaceholder(match.faceit_url)
      const existing = matchesByPlayerUrl[playerUrl] || []
      matchesByPlayerUrl[playerUrl] = existing.concat(matchUrl)
    }

    return acc.concat(enemies)
  }, [])

  const uniqueEnemies = uniqueByField(enemyPlayers, "player_id")

  const enemyInfos = await batchWithLimit(
    uniqueEnemies.map(enemy => () => getPlayerInfo(client, enemy.player_id)),
    DEFAULT_CONCURRENCY,
    (done, total) => {
      process.stdout.write(`\r⏳ Проверка игроков: ${done}/${total}`)
    },
  )
  console.log()

  const smurfs = (enemyInfos.filter(Boolean) as FaceitPlayer[]).filter(
    player => player.games[DEFAULT_GAME]?.faceit_elo < SMURF_ELO_THRESHOLD,
  )

  const matchesBySmurf: Record<string, string[]> = {}
  for (const smurf of smurfs) {
    const smurfUrl = replaceLangPlaceholder(smurf.faceit_url)
    matchesBySmurf[smurfUrl] = matchesByPlayerUrl[smurfUrl]
  }

  console.table(matchesBySmurf)
}

findSmurfs().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
