import fs from "fs"
import path from "path"
import {
  getFaceitApiKey,
  createFaceitClient,
  parseMatchId,
  fetchAndAnalyzeMatch,
} from "@faceit/core"
import type { TeamRecommendations } from "@faceit/core"

// Аргумент: ссылка на комнату faceit.com/*/room/1-<uuid> или сам match id
const INPUT = process.argv[2]

if (!INPUT) {
  console.error('Использование: npm run match -- "<ссылка на комнату | match id>"')
  process.exit(1)
}

const client = createFaceitClient(getFaceitApiKey())

function printRecommendations(recs: TeamRecommendations) {
  console.log(`\n=== ${recs.teamName} ===`)
  if (recs.lowData) {
    console.log("⚠️ Мало матчей в истории — рекомендации ненадёжны")
  }
  console.log("\n🟢 Что пикать:")
  console.table(
    recs.picks.slice(0, 3).map(r => ({
      Карта: r.map,
      Score: r.score.toFixed(2),
      Почему: r.reason,
    })),
  )
  console.log("🔴 Что банить:")
  console.table(
    recs.bans.slice(0, 3).map(r => ({
      Карта: r.map,
      Score: r.score.toFixed(2),
      Почему: r.reason,
    })),
  )
}

async function main() {
  const matchId = parseMatchId(INPUT)
  console.log("🚀 Пре-матч анализ комнаты:", matchId)

  const result = await fetchAndAnalyzeMatch(client, matchId, {
    onProgress: (team, done, total) => {
      process.stdout.write(`\r⏳ ${team}: загрузка матчей ${done}/${total}          `)
    },
  })
  console.log()

  const [a, b] = result.teams
  console.log(`\n⚔️ ${a.name} (avg ELO ${a.avgElo}) vs ${b.name} (avg ELO ${b.avgElo})`)
  if (result.competitionName) console.log(`🏆 ${result.competitionName} (BO${result.bestOf ?? "?"})`)
  for (const team of result.teams) {
    console.log(
      `👥 ${team.name}: ${team.roster.map(p => `${p.nickname} (lvl ${p.skillLevel})`).join(", ")}`,
    )
  }

  for (const insight of result.insights) {
    if (insight.type === "map-recommendations") {
      insight.teams.forEach(printRecommendations)
    }
  }

  const statsDir = path.resolve("output", "stats")
  fs.mkdirSync(statsDir, { recursive: true })
  const statPath = path.join(statsDir, `match-${matchId}.json`)
  fs.writeFileSync(statPath, JSON.stringify(result, null, 2), "utf-8")
  console.log(`\n💾 Полный результат: ${statPath}`)
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
