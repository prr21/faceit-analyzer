import fs from "fs"
import path from "path"
import {
  getFaceitApiKey,
  createFaceitClient,
  fetchAndAnalyzePlayer,
} from "@faceit/core"
import { writePlayerReport } from "./report-writer.js"

const PLAYER_NICKNAME = process.argv[2] || "dErzz"

const client = createFaceitClient(getFaceitApiKey())

async function main() {
  console.log(`\n🔍 Анализ игрока: ${PLAYER_NICKNAME}`)

  const { stats: playerStats } = await fetchAndAnalyzePlayer(client, PLAYER_NICKNAME, {
    onProgress: (done, total) => {
      process.stdout.write(`\r⏳ Загрузка матчей: ${done}/${total}`)
    },
  })
  console.log()

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
