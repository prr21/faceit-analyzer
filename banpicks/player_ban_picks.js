const axios = require("axios")

// Константы
const API_KEY = "c7d51517-ae0a-4ad4-b345-3da41e97713b" // Замените на ваш API-ключ
const BASE_URL = "https://open.faceit.com/data/v4"
const PLAYER_NICKNAME = "dErzz" // Замените на ник игрока
const GAME_COUNT = 100 // Количество игр для анализа
const GAME = "cs2" // Игра для анализа

// Axios instance с заголовком авторизации
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${API_KEY}` },
})

// Функция для получения player_id по нику игрока
async function getPlayerId(nickname) {
  try {
    const response = await apiClient.get(`/players`, { params: { nickname } })
    return response.data.player_id
  } catch (error) {
    console.error(
      "Ошибка при получении player_id:",
      error.response?.data || error.message
    )
    throw error
  }
}

// Функция для получения истории матчей игрока
async function getPlayerMatches(playerId, limit = GAME_COUNT) {
  try {
    const response = await apiClient.get(`/players/${playerId}/history`, {
      params: { game: GAME, limit },
    })
    return response.data.items.map(match => match.match_id) // Возвращаем только ID матчей
  } catch (error) {
    console.error(
      "Ошибка при получении истории матчей:",
      error.response?.data || error.message
    )
    throw error
  }
}

// Функция для получения детальной информации о матче
async function getMatchDetails(matchId) {
  try {
    const response = await apiClient.get(`/matches/${matchId}`)
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

function analyzeMapBans(matchesData, playerId) {
  const dropPickStats = {
    bans: {}, // Карта: количество банов
    play: {}, // Карта: количество выборов

    banFirst: {},
  }

  matchesData.forEach(({ match, history }) => {
    if (!history) {
      if (!match.voting) {
        return
      }
      match.voting.map.pick.forEach(mapName => {
        dropPickStats.play[mapName] = (dropPickStats.play[mapName] || 0) + 1
      })

      return
    }

    const isFaction1Leader = match.teams.faction1.leader === playerId
    const isFaction2Leader = match.teams.faction2.leader === playerId

    if (!isFaction1Leader) {
      if (!isFaction2Leader) {
        return
      }
    }

    const teamFactionStr = isFaction1Leader ? "faction1" : "faction2"

    // Проверяем наличие данных о drop/pick
    if (history.tickets) {
      history.tickets.forEach(ticket => {
        if (ticket.entity_type === "map") {
          ticket.entities.forEach(entity => {
            const { guid, status, selected_by, round } = entity

            if (guid === "de_anubis") {
              return
            }

            // Проверяем, принадлежит ли действие команде игрока
            if (selected_by === teamFactionStr) {
              if (status === "drop") {
                dropPickStats.bans[guid] = (dropPickStats.bans[guid] || 0) + 1

                if (round === 1) {
                  dropPickStats.banFirst[guid] =
                    (dropPickStats.banFirst[guid] || 0) + 1
                }
                if (round === 2) {
                  dropPickStats.banFirst[guid] =
                    (dropPickStats.banFirst[guid] || 0) + 1
                }
              }
            }
            if (status === "pick") {
              dropPickStats.play[guid] = (dropPickStats.play[guid] || 0) + 1
            }
          })
        }
      })
    }
  })

  return dropPickStats
}

// Основная функция
;(async () => {
  try {
    // Шаг 1: Получаем player_id
    const playerId = await getPlayerId(PLAYER_NICKNAME)

    // Шаг 2: Получаем последние N матчей
    const matchIds = await getPlayerMatches(playerId, GAME_COUNT)

    // Шаг 3: Получаем детальную информацию о каждом матче
    const matchesData = await Promise.all(
      matchIds.map(matchId => getMatchDetails(matchId))
    )

    // Шаг 4: Анализируем баны карт
    const bans = analyzeMapBans(matchesData, playerId)
    const bansForConsoleTable = {
      "Количество банов": bans.bans,
      "Количество инста банов": bans.banFirst,
      "Количество сыгранных": bans.play,
    }

    // Группируем баны по карте
    // const groupedBans = bans.reduce((acc, ban) => {
    //   acc[ban.map_name] = (acc[ban.map_name] || 0) + 1
    //   return acc
    // }, {})

    // Выводим результат
    console.log(`Карты, забаненные игроком ${PLAYER_NICKNAME}:`)
    console.table(bansForConsoleTable)
  } catch (error) {
    console.error("Произошла ошибка:", error.message)
  }
})()
