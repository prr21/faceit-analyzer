import fs from "fs"
import path from "path"
import {
  FACEIT_API_KEY,
  DEFAULT_CONCURRENCY,
  createFaceitClient,
  getPlayerId,
  getPlayerMatches,
  getPlayerInfo,
  getMatchWithVoting,
  batchWithLimit,
  analyzePlayerMapStrategy,
  writePlayerReport,
} from "@faceit/core"

const PLAYER_NICKNAME = process.argv[2] || "dErzz"

const client = createFaceitClient(FACEIT_API_KEY)

async function main() {
  const playerId = await getPlayerId(client, PLAYER_NICKNAME)

  const [playerInfo, matches] = await Promise.all([
    getPlayerInfo(client, playerId),
    getPlayerMatches(client, playerId),
  ])
  const matchIds = matches.map(m => m.match_id)

  console.log(`\n🔍 Всего найдено ${matchIds.length} матчей`)

  const matchesData = await batchWithLimit(
    matchIds.map(matchId => () => getMatchWithVoting(client, matchId)),
    DEFAULT_CONCURRENCY,
    (done, total) => {
      process.stdout.write(`\r⏳ Загрузка матчей: ${done}/${total}`)
    },
  )
  console.log()

  const playerStats = analyzePlayerMapStrategy(matchesData, playerId, PLAYER_NICKNAME)

  // Заполняем профиль игрока
  if (playerInfo) {
    const cs2 = playerInfo.games?.cs2
    playerStats.playerProfile = {
      nickname: playerInfo.nickname,
      avatar: playerInfo.avatar,
      skillLevel: cs2?.skill_level ?? 0,
      currentElo: cs2?.faceit_elo ?? 0,
      country: playerInfo.country,
    }
  }

  console.log(`\n✅ Анализ завершен! ${playerStats.mapInfo}`)

  console.table({
    "Первый бан": playerStats.stats.firstBan,
    "Второй бан": playerStats.stats.secondBan,
    "Последний бан": playerStats.stats.thirdBan,
    "": {},
    "Десайдер": playerStats.decider,
    " ": {},
    "Пик (бо3)": playerStats.stats.firstPick,
  })

  const statsDir = path.resolve("output", "stats")
  fs.mkdirSync(statsDir, { recursive: true })
  const statPath = path.join(statsDir, PLAYER_NICKNAME + ".json")
  fs.writeFileSync(statPath, JSON.stringify(playerStats, null, 2), "utf-8")

  const reportPath = path.join("output", "reports", PLAYER_NICKNAME + ".html")
  writePlayerReport(reportPath, PLAYER_NICKNAME, playerStats)
  console.log(`\n📊 HTML-отчёт: ${reportPath}`)
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
