import fs from "fs"
import path from "path"
import {
  FACEIT_API_KEY,
  DEFAULT_CONCURRENCY,
  teams,
  createFaceitClient,
  getPlayerMatches,
  getMatchWithVoting,
  batchWithLimit,
  analyzeTeamMapStrategy,
  writeTeamReport,
} from "@faceit/core"

const TEAM_NAME = process.argv[2] || "Satanics Aura"
const MIN_PLAYERS_IN_MATCH = 3

const client = createFaceitClient(FACEIT_API_KEY)

async function main() {
  const teamPlayerIds = teams[TEAM_NAME]
  if (!teamPlayerIds) {
    throw new Error(`Команда "${TEAM_NAME}" не найдена в ростерах`)
  }

  console.log("🚀 Запуск анализа команды:", TEAM_NAME)

  // Собираем все матчи игроков команды
  const playersMatches = await batchWithLimit(
    teamPlayerIds.map(id => () => getPlayerMatches(client, id)),
    DEFAULT_CONCURRENCY,
  )
  const allMatches = playersMatches.flat()

  // Группируем матчи — только те, где минимум 3 игрока команды
  const matchPlayerCount: Record<string, number> = {}
  for (const match of allMatches) {
    matchPlayerCount[match.match_id] = (matchPlayerCount[match.match_id] || 0) + 1
  }

  const uniqueMatchCount = Object.keys(matchPlayerCount).length
  console.log(`\n🔍 Всего найдено ${uniqueMatchCount} уникальных матчей`)

  const teamMatchIds = Object.keys(matchPlayerCount).filter(
    id => matchPlayerCount[id] >= MIN_PLAYERS_IN_MATCH,
  )

  console.log(
    `✅ Найдено ${teamMatchIds.length} матчей, где участвовали хотя бы ${MIN_PLAYERS_IN_MATCH} игрока команды ${TEAM_NAME}`,
  )

  const matchesWithDetail = await batchWithLimit(
    teamMatchIds.map(id => () => getMatchWithVoting(client, id)),
    DEFAULT_CONCURRENCY,
    (done, total) => {
      process.stdout.write(`\r⏳ Загрузка матчей: ${done}/${total}`)
    },
  )
  console.log()

  const mapStatistic = analyzeTeamMapStrategy(matchesWithDetail, teamPlayerIds, TEAM_NAME)

  console.log("\n✅ Анализ завершен!", mapStatistic.mapInfo)

  console.table({
    "Первый Бан": mapStatistic.target.firstBan,
    "Второй Бан": mapStatistic.target.secondBan,
    "Третий Бан": mapStatistic.target.thirdBan,
    "": {},
    Десайдер: mapStatistic.decider,
    " ": {},
    "Пик (бо3)": mapStatistic.target.firstPick,
    "Пик противников (бо3)": mapStatistic.enemy.firstPick,
  })

  const statsDir = path.resolve("output", "stats")
  fs.mkdirSync(statsDir, { recursive: true })
  const statPath = path.join(statsDir, TEAM_NAME + ".json")
  fs.writeFileSync(statPath, JSON.stringify(mapStatistic, null, 2), "utf-8")

  const reportPath = path.join("output", "reports", TEAM_NAME + ".html")
  writeTeamReport(reportPath, TEAM_NAME, mapStatistic)
  console.log(`\n📊 HTML-отчёт: ${reportPath}`)
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
