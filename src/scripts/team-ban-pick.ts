import fs from "fs"
import path from "path"
import { FACEIT_API_KEY, teams } from "../config.js"
import { createFaceitClient } from "../api/client.js"
import { getPlayerMatches } from "../api/faceit-open.js"
import { getMatchWithVoting } from "../api/faceit-internal.js"
import {
  findMapVotingTicket,
  isExcludedMap,
  classifyVotingEntity,
  incrementMapCount,
} from "../utils/map-voting.js"
import type { FactionBanPickStats, FaceitMatchDetail, TeamDropPickStats, VotingPayload } from "../types/faceit.js"

const TEAM_NAME = process.argv[2] || "Satanics Aura"
const MIN_PLAYERS_IN_MATCH = 3

const client = createFaceitClient(FACEIT_API_KEY)

function createEmptyFactionStats(): FactionBanPickStats {
  return { firstBan: {}, firstPick: {}, secondBan: {}, thirdBan: {} }
}

async function analyzeTeamMapStrategy(teamPlayerIds: string[]): Promise<TeamDropPickStats> {
  const stats: TeamDropPickStats = {
    target: createEmptyFactionStats(),
    enemy: createEmptyFactionStats(),
    decider: {},
    earliestGame: "",
    latestGame: "",
    mapInfo: "",
    count: 0,
    allCount: 0,
  }

  // Собираем все матчи игроков команды
  const playersMatches = await Promise.all(
    teamPlayerIds.map(id => getPlayerMatches(client, id)),
  )
  const allMatches = playersMatches.flat()

  console.log(`\n🔍 Всего собрано ${allMatches.length} матчей от всех игроков`)
  stats.allCount = allMatches.length

  // Группируем матчи — только те, где минимум 3 игрока команды
  const matchPlayerCount: Record<string, number> = {}
  for (const match of allMatches) {
    matchPlayerCount[match.match_id] = (matchPlayerCount[match.match_id] || 0) + 1
  }

  const teamMatchIds = Object.keys(matchPlayerCount).filter(
    id => matchPlayerCount[id] >= MIN_PLAYERS_IN_MATCH,
  )

  console.log(
    `✅ Найдено ${teamMatchIds.length} матчей, где участвовали хотя бы ${MIN_PLAYERS_IN_MATCH} игрока команды ${TEAM_NAME}`,
  )

  const matchesWithDetail = await Promise.all(
    teamMatchIds.map(id => getMatchWithVoting(client, id)),
  )

  let analyzedMatches = 0
  let latestGame = 0
  let earliestGame = Date.now()

  for (const { match, history } of matchesWithDetail) {
    if (!match || !history) continue

    if (match.started_at > latestGame) latestGame = match.started_at
    if (match.started_at < earliestGame) earliestGame = match.started_at

    // Определяем faction целевой команды по лидеру
    const targetFaction = findTargetFaction(match, teamPlayerIds)
    if (!targetFaction) continue

    const mapVoting = findMapVotingTicket(history)
    if (!mapVoting) continue

    const deciderRound = mapVoting.entities.at(-1)!.round

    for (const entity of mapVoting.entities) {
      if (isExcludedMap(entity.guid)) continue

      const phase = classifyVotingEntity(entity, deciderRound)
      if (!phase) continue

      if (phase === "decider") {
        incrementMapCount(stats.decider, entity.guid)
        continue
      }

      const side = entity.selected_by === targetFaction ? "target" : "enemy"
      incrementMapCount(stats[side][phase], entity.guid)
    }

    analyzedMatches++
  }

  stats.mapInfo = `Анализ на основе ${analyzedMatches} матчей, в котором играли минимум ${MIN_PLAYERS_IN_MATCH} человека из команды "${TEAM_NAME}"`
  stats.count = analyzedMatches
  stats.latestGame = new Date(latestGame * 1000).toLocaleString("ru-RU")
  stats.earliestGame = new Date(earliestGame * 1000).toLocaleString("ru-RU")

  console.log("\n✅ Анализ завершен!", stats.mapInfo)
  return stats
}

function findTargetFaction(
  match: FaceitMatchDetail,
  teamPlayerIds: string[],
): "faction1" | "faction2" | null {
  for (const playerId of teamPlayerIds) {
    if (match.teams.faction1.leader === playerId) return "faction1"
    if (match.teams.faction2.leader === playerId) return "faction2"
  }
  return null
}

async function main() {
  const teamPlayerIds = teams[TEAM_NAME]
  if (!teamPlayerIds) {
    throw new Error(`Команда "${TEAM_NAME}" не найдена в ростерах`)
  }

  console.log("🚀 Запуск анализа команды:", TEAM_NAME)

  const mapStatistic = await analyzeTeamMapStrategy(teamPlayerIds)

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
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
