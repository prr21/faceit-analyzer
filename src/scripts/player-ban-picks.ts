import fs from "fs"
import path from "path"
import { FACEIT_API_KEY, DEFAULT_CONCURRENCY } from "../config.js"
import { createFaceitClient } from "../api/client.js"
import { getPlayerId, getPlayerMatches } from "../api/faceit-open.js"
import { getMatchWithVoting } from "../api/faceit-internal.js"
import { batchWithLimit } from "../utils/concurrency.js"
import {
  findMapVotingTicket,
  isPoolMap,
  classifyVotingEntity,
  getDeciderRound,
  incrementMapCount,
} from "../utils/map-voting.js"
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
  const playerStats: PlayerDropPickStats = {
    stats: createEmptyFactionStats(),
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
    allCount: matchesData.length,
  }
  const trendsMap = new Map<string, TrendPeriod>()
  let analyzedMatches = 0
  let latestGame = 0
  let earliestGame = Infinity
  let eloSum = 0
  let eloCount = 0

  for (const { match, history } of matchesData) {
    if (match.started_at > latestGame) latestGame = match.started_at
    if (match.started_at < earliestGame) earliestGame = match.started_at

    const playerFaction = findPlayerFaction(match, playerId)
    if (!playerFaction) continue

    const won = match.results?.winner === playerFaction

    const monthKey = getMonthKey(match.started_at)
    const trend = getOrCreateTrend(trendsMap, monthKey)

    // ELO и доп. статистика
    const factionStats = match.teams[playerFaction].stats
    if (factionStats?.rating) {
      playerStats.eloHistory.push({
        date: match.started_at,
        elo: factionStats.rating,
        result: won ? "win" : "loss",
      })
      eloSum += factionStats.rating
      eloCount++
    }

    if (factionStats?.winProbability !== undefined && match.results?.winner) {
      trackFavoriteUnderdog(playerStats.favoriteUnderdog, factionStats.winProbability, won)
    }

    if (match.competition_type && match.results?.winner) {
      trackCompetitionType(playerStats.competitionStats, match.competition_type, won)
    }

    // Баны/пики — только если игрок лидер и есть voting history
    if (isLeader(match, playerId) && history) {
      const mapVoting = findMapVotingTicket(history)
      if (mapVoting) {
        const deciderRound = getDeciderRound(mapVoting)

        for (const entity of mapVoting.entities) {
          if (!isPoolMap(entity.guid)) continue

          const phase = classifyVotingEntity(entity, deciderRound)
          if (!phase) continue

          if (phase === "decider") {
            incrementMapCount(playerStats.decider, entity.guid)
            incrementMapCount(trend.decider, entity.guid)
            // Десайдер винрейт
            if (match.results?.winner) {
              trackWinRate(playerStats.deciderWinRate, entity.guid, won)
            }
            continue
          }

          // Только свои баны/пики
          if (entity.selected_by === playerFaction) {
            incrementMapCount(playerStats.stats[phase], entity.guid)
            incrementMapCount(trend.stats[phase], entity.guid)
          }
        }

        analyzedMatches++
      }
    }

    // Винрейт — для ВСЕХ матчей (не только leader)
    const playedMaps = match.voting?.map?.pick || []
    if (match.results?.winner && playedMaps.length > 0) {
      if (match.detailed_results && match.detailed_results.length > 0) {
        // BO3/BO1 с detailed_results — только реально сыгранные карты
        const playedCount = Math.min(playedMaps.length, match.detailed_results.length)
        for (let i = 0; i < playedCount; i++) {
          if (!isPoolMap(playedMaps[i])) continue
          const mapWon = match.detailed_results[i].winner === playerFaction
          trackWinRate(playerStats.mapWinRate, playedMaps[i], mapWon)
          trackWinRate(trend.mapWinRate, playedMaps[i], mapWon)
          addMatchRecord(playerStats.matchRecords, playedMaps[i], buildMatchRecord(match, playerFaction, playedMaps[i], i, mapWon))
        }
      } else {
        // BO1 без detailed_results: результат матча = результат карты
        for (let i = 0; i < playedMaps.length; i++) {
          const mapName = playedMaps[i]
          if (!isPoolMap(mapName)) continue
          trackWinRate(playerStats.mapWinRate, mapName, won)
          trackWinRate(trend.mapWinRate, mapName, won)
          addMatchRecord(playerStats.matchRecords, mapName, buildMatchRecord(match, playerFaction, mapName, i, won))
        }
      }
    }

    // ELO тренда
    if (factionStats?.rating) {
      const trendEloEntries = playerStats.eloHistory.filter(e => getMonthKey(e.date) === monthKey)
      trend.avgElo = Math.round(trendEloEntries.reduce((s, e) => s + e.elo, 0) / trendEloEntries.length)
    }

    trend.matchCount++
  }

  playerStats.avgElo = eloCount > 0 ? Math.round(eloSum / eloCount) : 0
  playerStats.count = analyzedMatches
  playerStats.mapInfo = `Анализ на основе ${analyzedMatches} матчей, где "${PLAYER_NICKNAME}" был лидером`
  playerStats.latestGame = latestGame > 0 ? new Date(latestGame * 1000).toLocaleString("ru-RU") : ""
  playerStats.earliestGame = earliestGame < Infinity ? new Date(earliestGame * 1000).toLocaleString("ru-RU") : ""
  playerStats.trends = [...trendsMap.values()].sort((a, b) => a.label.localeCompare(b.label))
  playerStats.eloHistory.sort((a, b) => a.date - b.date)
  for (const records of Object.values(playerStats.matchRecords)) {
    records.sort((a, b) => b.date - a.date)
  }

  return playerStats
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
