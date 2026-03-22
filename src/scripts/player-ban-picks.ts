import fs from "fs"
import path from "path"
import { FACEIT_API_KEY, DEFAULT_CONCURRENCY } from "../config.js"
import { createFaceitClient } from "../api/client.js"
import { getPlayerId, getPlayerMatches } from "../api/faceit-open.js"
import { getMatchWithVoting } from "../api/faceit-internal.js"
import { batchWithLimit } from "../utils/concurrency.js"
import {
  findMapVotingTicket,
  isExcludedMap,
  classifyVotingEntity,
  getDeciderRound,
  incrementMapCount,
} from "../utils/map-voting.js"
import { createEmptyFactionStats, trackWinRate, getMonthKey, getOrCreateTrend } from "../utils/match-stats.js"
import { generatePlayerHtmlReport } from "../utils/html-report.js"
import type { FaceitMatchDetail, PlayerDropPickStats, TrendPeriod, VotingPayload } from "../types/faceit.js"

const PLAYER_NICKNAME = process.argv[2] || "dErzz"

const client = createFaceitClient(FACEIT_API_KEY)

function findPlayerFaction(
  match: FaceitMatchDetail,
  playerId: string,
): "faction1" | "faction2" | null {
  // Сначала проверяем лидерство
  if (match.teams.faction1.leader === playerId) return "faction1"
  if (match.teams.faction2.leader === playerId) return "faction2"
  // Fallback: ищем в составе (для винрейта, когда игрок не лидер)
  if (match.teams.faction1.players?.some(p => p.player_id === playerId)) return "faction1"
  if (match.teams.faction2.players?.some(p => p.player_id === playerId)) return "faction2"
  return null
}

function isLeader(match: FaceitMatchDetail, playerId: string): boolean {
  return match.teams.faction1.leader === playerId || match.teams.faction2.leader === playerId
}

function analyzePlayerMapStrategy(
  matchesData: Array<{ match: FaceitMatchDetail; history: VotingPayload | null }>,
  playerId: string,
): PlayerDropPickStats {
  const stats: PlayerDropPickStats = {
    stats: createEmptyFactionStats(),
    decider: {},
    mapWinRate: {},
    trends: [],
    earliestGame: "",
    latestGame: "",
    mapInfo: "",
    count: 0,
    allCount: matchesData.length,
  }
  const trendsMap = new Map<string, TrendPeriod>()
  let analyzedMatches = 0
  let latestGame = 0
  let earliestGame = Infinity

  for (const { match, history } of matchesData) {
    if (match.started_at > latestGame) latestGame = match.started_at
    if (match.started_at < earliestGame) earliestGame = match.started_at

    const playerFaction = findPlayerFaction(match, playerId)
    if (!playerFaction) continue

    const monthKey = getMonthKey(match.started_at)
    const trend = getOrCreateTrend(trendsMap, monthKey)

    // Баны/пики — только если игрок лидер и есть voting history
    if (isLeader(match, playerId) && history) {
      const mapVoting = findMapVotingTicket(history)
      if (mapVoting) {
        const deciderRound = getDeciderRound(mapVoting)

        for (const entity of mapVoting.entities) {
          if (isExcludedMap(entity.guid)) continue

          const phase = classifyVotingEntity(entity, deciderRound)
          if (!phase) continue

          if (phase === "decider") {
            incrementMapCount(stats.decider, entity.guid)
            incrementMapCount(trend.decider, entity.guid)
            continue
          }

          // Только свои баны/пики
          if (entity.selected_by === playerFaction) {
            incrementMapCount(stats.stats[phase], entity.guid)
            incrementMapCount(trend.stats[phase], entity.guid)
          }
        }

        analyzedMatches++
      }
    }

    // Винрейт — для ВСЕХ матчей (не только leader)
    const playedMaps = match.voting?.map?.pick || []
    if (match.results?.winner && playedMaps.length > 0) {
      const overallWon = match.results.winner === playerFaction

      if (match.detailed_results && match.detailed_results.length === playedMaps.length) {
        // BO3: пораундовые результаты
        for (let i = 0; i < playedMaps.length; i++) {
          if (isExcludedMap(playedMaps[i])) continue
          const mapWon = match.detailed_results[i].winner === playerFaction
          trackWinRate(stats.mapWinRate, playedMaps[i], mapWon)
          trackWinRate(trend.mapWinRate, playedMaps[i], mapWon)
        }
      } else {
        // BO1: результат матча = результат карты
        for (const mapName of playedMaps) {
          if (isExcludedMap(mapName)) continue
          trackWinRate(stats.mapWinRate, mapName, overallWon)
          trackWinRate(trend.mapWinRate, mapName, overallWon)
        }
      }
    }

    trend.matchCount++
  }

  stats.count = analyzedMatches
  stats.mapInfo = `Анализ на основе ${analyzedMatches} матчей, где "${PLAYER_NICKNAME}" был лидером`
  stats.latestGame = latestGame > 0 ? new Date(latestGame * 1000).toLocaleString("ru-RU") : ""
  stats.earliestGame = earliestGame < Infinity ? new Date(earliestGame * 1000).toLocaleString("ru-RU") : ""
  stats.trends = [...trendsMap.values()].sort((a, b) => a.label.localeCompare(b.label))

  return stats
}

async function main() {
  const playerId = await getPlayerId(client, PLAYER_NICKNAME)

  const matches = await getPlayerMatches(client, playerId)
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

  const playerStats = analyzePlayerMapStrategy(matchesData, playerId)

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

  const reportsDir = path.resolve("output", "reports")
  fs.mkdirSync(reportsDir, { recursive: true })
  const reportPath = path.join(reportsDir, PLAYER_NICKNAME + ".html")
  fs.writeFileSync(reportPath, generatePlayerHtmlReport(PLAYER_NICKNAME, playerStats), "utf-8")
  console.log(`\n📊 HTML-отчёт: ${reportPath}`)
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
