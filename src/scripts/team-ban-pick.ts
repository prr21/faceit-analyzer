import fs from "fs"
import path from "path"
import { FACEIT_API_KEY, DEFAULT_CONCURRENCY, teams } from "../config.js"
import { createFaceitClient } from "../api/client.js"
import { getPlayerMatches } from "../api/faceit-open.js"
import { getMatchWithVoting } from "../api/faceit-internal.js"
import { batchWithLimit } from "../utils/concurrency.js"
import {
  findMapVotingTicket,
  isPoolMap,
  classifyVotingEntity,
  getDeciderRound,
  incrementMapCount,
} from "../utils/map-voting.js"
import { writeTeamReport } from "../utils/report-writer.js"
import {
  createEmptyFactionStats,
  createEmptyFavoriteUnderdog,
  trackWinRate,
  trackFavoriteUnderdog,
  trackCompetitionType,
  buildMatchRecord,
  addMatchRecord,
  getMonthKey,
  getOrCreateTrend,
} from "../utils/match-stats.js"
import type { FaceitMatchDetail, TeamDropPickStats, TrendPeriod, VotingPayload } from "../types/faceit.js"

const TEAM_NAME = process.argv[2] || "Satanics Aura"
const MIN_PLAYERS_IN_MATCH = 3

const client = createFaceitClient(FACEIT_API_KEY)

async function analyzeTeamMapStrategy(teamPlayerIds: string[]): Promise<TeamDropPickStats> {
  const stats: TeamDropPickStats = {
    target: createEmptyFactionStats(),
    enemy: createEmptyFactionStats(),
    decider: {},
    mapWinRate: {},
    deciderWinRate: {},
    eloHistory: [],
    favoriteUnderdog: createEmptyFavoriteUnderdog(),
    competitionStats: {},
    matchRecords: {},
    avgElo: 0,
    trends: [],
    earliestGame: "",
    latestGame: "",
    mapInfo: "",
    count: 0,
    allCount: 0,
  }
  const trendsMap = new Map<string, TrendPeriod>()
  let eloSum = 0
  let eloCount = 0

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
  stats.allCount = uniqueMatchCount
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

  let analyzedMatches = 0
  let latestGame = 0
  let earliestGame = Infinity

  for (const { match, history } of matchesWithDetail) {
    if (!match) continue

    if (match.started_at > latestGame) latestGame = match.started_at
    if (match.started_at < earliestGame) earliestGame = match.started_at

    // Определяем faction целевой команды по лидеру
    const targetFaction = findTargetFaction(match, teamPlayerIds)
    if (!targetFaction) continue

    const won = match.results?.winner === targetFaction

    const monthKey = getMonthKey(match.started_at)
    const trend = getOrCreateTrend(trendsMap, monthKey)

    // ELO и доп. статистика
    const factionStats = match.teams[targetFaction].stats
    if (factionStats?.rating) {
      stats.eloHistory.push({
        date: match.started_at,
        elo: factionStats.rating,
        result: won ? "win" : "loss",
      })
      eloSum += factionStats.rating
      eloCount++
    }

    if (factionStats?.winProbability !== undefined && match.results?.winner) {
      trackFavoriteUnderdog(stats.favoriteUnderdog, factionStats.winProbability, won)
    }

    if (match.competition_type && match.results?.winner) {
      trackCompetitionType(stats.competitionStats, match.competition_type, won)
    }

    // Баны/Пики
    if (history) {
      const mapVoting = findMapVotingTicket(history)
      if (mapVoting) {
        const deciderRound = getDeciderRound(mapVoting)

        for (const entity of mapVoting.entities) {
          if (!isPoolMap(entity.guid)) continue

          const phase = classifyVotingEntity(entity, deciderRound)
          if (!phase) continue

          if (phase === "decider") {
            incrementMapCount(stats.decider, entity.guid)
            incrementMapCount(trend.decider, entity.guid)
            // Десайдер винрейт
            if (match.results?.winner) {
              trackWinRate(stats.deciderWinRate, entity.guid, won)
            }
            continue
          }

          const side = entity.selected_by === targetFaction ? "target" : "enemy"
          incrementMapCount(stats[side][phase], entity.guid)
          if (side === "target") {
            incrementMapCount(trend.stats[phase], entity.guid)
          }
        }

        analyzedMatches++
      }
    }

    // Винрейт по картам
    const playedMaps = match.voting?.map?.pick || []
    if (match.results?.winner && playedMaps.length > 0) {
      if (match.detailed_results && match.detailed_results.length > 0) {
        // BO3/BO1 с detailed_results — только реально сыгранные карты
        const playedCount = Math.min(playedMaps.length, match.detailed_results.length)
        for (let i = 0; i < playedCount; i++) {
          if (!isPoolMap(playedMaps[i])) continue
          const mapWon = match.detailed_results[i].winner === targetFaction
          trackWinRate(stats.mapWinRate, playedMaps[i], mapWon)
          trackWinRate(trend.mapWinRate, playedMaps[i], mapWon)
          addMatchRecord(stats.matchRecords, playedMaps[i], buildMatchRecord(match, targetFaction, playedMaps[i], i, mapWon))
        }
      } else {
        // BO1 без detailed_results: результат матча = результат карты
        for (let i = 0; i < playedMaps.length; i++) {
          const mapName = playedMaps[i]
          if (!isPoolMap(mapName)) continue
          trackWinRate(stats.mapWinRate, mapName, won)
          trackWinRate(trend.mapWinRate, mapName, won)
          addMatchRecord(stats.matchRecords, mapName, buildMatchRecord(match, targetFaction, mapName, i, won))
        }
      }
    }

    // ELO тренда
    if (factionStats?.rating) {
      const trendEloEntries = stats.eloHistory.filter(e => getMonthKey(e.date) === monthKey)
      trend.avgElo = Math.round(trendEloEntries.reduce((s, e) => s + e.elo, 0) / trendEloEntries.length)
    }

    trend.matchCount++
  }

  stats.avgElo = eloCount > 0 ? Math.round(eloSum / eloCount) : 0
  stats.mapInfo = `Анализ на основе ${analyzedMatches} матчей, в котором играли минимум ${MIN_PLAYERS_IN_MATCH} человека из команды "${TEAM_NAME}"`
  stats.count = analyzedMatches
  stats.latestGame = latestGame > 0 ? new Date(latestGame * 1000).toLocaleString("ru-RU") : ""
  stats.earliestGame = earliestGame < Infinity ? new Date(earliestGame * 1000).toLocaleString("ru-RU") : ""
  stats.trends = [...trendsMap.values()].sort((a, b) => a.label.localeCompare(b.label))
  stats.eloHistory.sort((a, b) => a.date - b.date)
  for (const records of Object.values(stats.matchRecords)) {
    records.sort((a, b) => b.date - a.date)
  }

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

  const reportPath = path.join("output", "reports", TEAM_NAME + ".html")
  writeTeamReport(reportPath, TEAM_NAME, mapStatistic)
  console.log(`\n📊 HTML-отчёт: ${reportPath}`)
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
