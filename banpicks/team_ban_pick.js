const fs = require("fs")
const path = require("path")
const axios = require("axios")

// Настройки
const { API_KEY, teams: teamsData, tmp } = require("./data.json")
const TEAM_NAME = "Satanics Aura" // Название команды-соперника
const MATCH_LIMIT = 100 // Количество матчей для анализа

// Инициализация клиента API
const api = axios.create({
  baseURL: "https://open.faceit.com/data/v4",
  headers: { Authorization: `Bearer ${API_KEY}` },
})

/**
 * Получение истории матчей игрока
 * @param {string} playerId - ID игрока
 * @returns {Promise<Array>} - Список матчей
 */
async function getPlayerMatches(playerId) {
  try {
    const response = await api.get(`/players/${playerId}/history`, {
      params: {
        game: "cs2",
        offset: 0,
        limit: MATCH_LIMIT,
      },
    })
    return response.data.items || []
  } catch (error) {
    console.error(
      `❌ Ошибка получения матчей игрока ${playerId}:`,
      error.response?.data || error.message
    )
    return []
  }
}

// Функция для получения детальной информации о матче
async function getMatchDetails(matchId) {
  try {
    const response = await api.get(`/matches/${matchId}`)
    let responseHistory = await fetch(
      `https://www.faceit.com/api/democracy/v1/match/${matchId}/history`
    )
    responseHistory = await responseHistory.json()

    return {
      match: response.data,
      history: responseHistory.payload,
    }
  } catch (error) {
    console.error(
      `Ошибка при получении данных матча (${matchId}):`,
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Анализ статистики бан/пиков команды
 * @param {Array} teamPlayerIds - Список player_id игроков команды
 */
async function analyzeTeamMapStrategy(teamPlayerIds) {
  const dropPickStats = {
    target: {
      banFirst: {},
      firstPick: {},
      secondBan: {},
      thirdBan: {},
    },
    enemy: {
      banFirst: {},
      firstPick: {},
      secondBan: {},
      thirdBan: {},
    },
    decider: {},
    earliestGame: "",
    latestGame: "",
    mapInfo: "",
    count: 0,
    allCount: 0,
  }

  // Собираем все матчи игроков команды
  const playersMatches = await Promise.all(teamPlayerIds.map(getPlayerMatches))
  const allMatches = playersMatches.flat()

  console.log(`\n🔍 Всего собрано ${allMatches.length} матчей от всех игроков`)
  dropPickStats.allCount = allMatches.length

  // Группируем матчи, чтобы найти только те, где играет вся команда
  const groupedMatches = {}

  for (const match of allMatches) {
    groupedMatches[match.match_id] = (groupedMatches[match.match_id] || 0) + 1
  }

  const teamMatchIds = Object.keys(groupedMatches).filter(
    matchId => groupedMatches[matchId] >= 3
  )

  console.log(
    `✅ Найдено ${teamMatchIds.length} матчей, где участвовали хотя бы 3 игрока команды ${TEAM_NAME}`
  )

  let analyzedMatches = 0

  // const matchesWithDetail = tmp
  const matchesWithDetail = await Promise.all(teamMatchIds.map(getMatchDetails))
  let latestGame = 0
  let earliestGame = Date.now()

  for (const { match: matchDetails, history } of matchesWithDetail) {
    if (!matchDetails || !history) continue

    if (matchDetails.started_at > latestGame) {
      latestGame = matchDetails.started_at
    }
    if (matchDetails.started_at < earliestGame) {
      earliestGame = matchDetails.started_at
    }

    // Определяем, какая faction является целевой командой
    let targetFaction
    const leaderIsFromTargetTeam = teamPlayerIds.some(playerId => {
      const isFaction1Leader = matchDetails.teams.faction1.leader === playerId
      const isFaction2Leader = matchDetails.teams.faction2.leader === playerId

      if (isFaction1Leader) {
        targetFaction = "faction1"
        return true
      }
      if (isFaction2Leader) {
        targetFaction = "faction2"
        return true
      }
      return false
    })

    if (!leaderIsFromTargetTeam) {
      continue
    }

    // Поиск данных о банах/пиках
    const mapVoting = history.tickets?.find(
      ticket => ticket.entity_type === "map"
    )

    if (!mapVoting) continue

    const deciderRoundNumber = mapVoting.entities.at(-1).round

    mapVoting.entities.forEach(entity => {
      const { guid, status, selected_by, round } = entity

      if (guid === "de_anubis") {
        return
      }

      const isStep1 = round === 1 || round === 2
      const isStep2 = round === 3 || round === 4
      const isStep3 = round === 5 || round === 6

      const isFirstBan = isStep1 && status === "drop"
      const isFirstPick = isStep2 && status === "pick"
      const isSecondBan = isStep2 && status === "drop"
      const isThirdBan = isStep3 && status === "drop"
      const isDecider = round === deciderRoundNumber

      if (isDecider) {
        dropPickStats.decider[guid] = (dropPickStats.decider[guid] || 0) + 1
        return
      }

      const teamStats = selected_by === targetFaction ? "target" : "enemy"
      const teamDropPick = dropPickStats[teamStats]

      if (isFirstBan) {
        teamDropPick.banFirst[guid] = (teamDropPick.banFirst[guid] || 0) + 1
        return
      }
      if (isSecondBan) {
        teamDropPick.secondBan[guid] = (teamDropPick.secondBan[guid] || 0) + 1
        return
      }
      if (isThirdBan) {
        teamDropPick.thirdBan[guid] = (teamDropPick.thirdBan[guid] || 0) + 1
        return
      }
      if (isFirstPick) {
        teamDropPick.firstPick[guid] = (teamDropPick.firstPick[guid] || 0) + 1
        return
      }
      return
    })

    analyzedMatches++
    continue
  }
  const mapInfo = `Анализ на основе ${analyzedMatches} матчей, в котором играли минимум 3 человека из команды "${TEAM_NAME}"`

  dropPickStats.mapInfo = mapInfo
  console.log("\n✅ Анализ завершен!", mapInfo)

  dropPickStats.count = analyzedMatches
  dropPickStats.latestGame = new Date(latestGame * 1000).toLocaleString("ru-RU")
  dropPickStats.earliestGame = new Date(earliestGame * 1000).toLocaleString(
    "ru-RU"
  )
  return dropPickStats
}

// Основная функция
;(async () => {
  const teamPlayerIds = teamsData[TEAM_NAME]
  if (!teamPlayerIds) {
    throw "retard"
  }
  console.log("🚀 Запуск анализа команды:", TEAM_NAME)

  const mapStatistic = await analyzeTeamMapStrategy(teamPlayerIds)

  const statPath = path.join(path.resolve(), "stats", TEAM_NAME + ".json")

  const bansForConsoleTable = {
    "Первый Бан": mapStatistic.target.banFirst,
    "Второй Бан": mapStatistic.target.secondBan,
    "Третий Бан": mapStatistic.target.thirdBan,
    "": {},
    Десайдер: mapStatistic.decider,
    " ": {},
    "Пик (бо3)": mapStatistic.target.firstPick,
    "Пик противников (бо3)": mapStatistic.enemy.firstPick,
  }

  console.table(bansForConsoleTable)

  fs.writeFileSync(statPath, JSON.stringify(mapStatistic, null, 2), {
    encoding: "utf-8",
  })
})()
