import fs from "fs"
import path from "path"
import {
  getFaceitApiKey,
  createFaceitClient,
  fetchAndAnalyzeTeam,
  searchTeams,
  getTeamInfo,
} from "@faceit/core"
import type { FaceitClient, TeamInfo } from "@faceit/core"
import { writeTeamReport } from "./report-writer.js"

// Аргумент: имя команды, UUID или ссылка faceit.com/*/teams/{uuid}
const QUERY = process.argv[2] || "Satanics Aura"

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

const client = createFaceitClient(getFaceitApiKey())

async function resolveTeam(client: FaceitClient, query: string): Promise<TeamInfo> {
  const uuidMatch = query.match(UUID_RE)
  if (uuidMatch) {
    const info = await getTeamInfo(client, uuidMatch[0])
    if (!info) {
      throw new Error(`Команда с id ${uuidMatch[0]} не найдена в FACEIT`)
    }
    return info
  }

  const results = await searchTeams(client, query)
  if (results.length === 0) {
    throw new Error(`Команда "${query}" не найдена в FACEIT`)
  }
  const exact = results.find(t => t.name.toLowerCase() === query.toLowerCase())
  const picked = exact ?? results[0]
  if (!exact && results.length > 1) {
    console.log(
      `🔎 Точного совпадения нет, беру "${picked.name}". Другие варианты: ${results
        .slice(1)
        .map(t => t.name)
        .join(", ")}`,
    )
  }

  const info = await getTeamInfo(client, picked.team_id)
  if (!info) {
    throw new Error(`Не удалось загрузить состав команды "${picked.name}"`)
  }
  return info
}

async function main() {
  const team = await resolveTeam(client, QUERY)
  const teamPlayerIds = team.members.map(m => m.player_id)
  if (teamPlayerIds.length === 0) {
    throw new Error(`У команды "${team.name}" пустой состав`)
  }

  console.log("🚀 Запуск анализа команды:", team.name)
  console.log("👥 Состав:", team.members.map(m => m.nickname).join(", "))

  const { stats: mapStatistic } = await fetchAndAnalyzeTeam(client, teamPlayerIds, team.name, {
    minPlayers: Math.min(3, teamPlayerIds.length),
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
  const statPath = path.join(statsDir, team.name + ".json")
  fs.writeFileSync(statPath, JSON.stringify(mapStatistic, null, 2), "utf-8")

  const reportPath = path.join("output", "reports", team.name + ".html")
  writeTeamReport(reportPath, team.name, mapStatistic)
  console.log(`\n📊 HTML-отчёт: ${reportPath}`)
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
