import fs from "fs"
import path from "path"
import {
  getFaceitApiKey,
  createFaceitClient,
  fetchAndAnalyzeTeam,
} from "@faceit/core"
import { writeTeamReport } from "./report-writer.js"
import teamsData from "./data/teams.json" with { type: "json" }

const teams: Record<string, string[]> = teamsData

const TEAM_NAME = process.argv[2] || "Satanics Aura"

const client = createFaceitClient(getFaceitApiKey())

async function main() {
  const teamPlayerIds = teams[TEAM_NAME]
  if (!teamPlayerIds) {
    throw new Error(`Команда "${TEAM_NAME}" не найдена в ростерах`)
  }

  console.log("🚀 Запуск анализа команды:", TEAM_NAME)

  const { stats: mapStatistic } = await fetchAndAnalyzeTeam(client, teamPlayerIds, TEAM_NAME, {
    onProgress: (done, total) => {
      process.stdout.write(`\r⏳ Загрузка матчей: ${done}/${total}`)
    },
  })
  console.log()

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
