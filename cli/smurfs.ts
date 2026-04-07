import {
  getFaceitApiKey,
  DEFAULT_GAME,
  DEFAULT_CONCURRENCY,
  createFaceitClient,
  getPlayerId,
  getPlayerMatches,
  getPlayerInfo,
  batchWithLimit,
  uniqueByField,
  collectEnemyPlayers,
  filterSmurfs,
} from "@faceit/core"

const SMURF_ELO_THRESHOLD = 1300
const PLAYER_NICKNAME = process.argv[2] || "ed1v9k"

const client = createFaceitClient(getFaceitApiKey())

async function main() {
  const playerId = await getPlayerId(client, PLAYER_NICKNAME)
  const matches = await getPlayerMatches(client, playerId)

  const { enemies, matchesByPlayerUrl } = collectEnemyPlayers(matches, playerId)
  const uniqueEnemies = uniqueByField(enemies, "player_id")

  const enemyInfos = await batchWithLimit(
    uniqueEnemies.map(enemy => () => getPlayerInfo(client, enemy.player_id)),
    DEFAULT_CONCURRENCY,
    (done, total) => {
      process.stdout.write(`\r⏳ Проверка игроков: ${done}/${total}`)
    },
  )
  console.log()

  const result = filterSmurfs(enemyInfos, matchesByPlayerUrl, DEFAULT_GAME, SMURF_ELO_THRESHOLD)
  console.table(result.matchesBySmurf)
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
