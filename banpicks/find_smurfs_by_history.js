const axios = require("axios")

// Настройки
const API_KEY = "c7d51517-ae0a-4ad4-b345-3da41e97713b" // Замените на ваш API-ключ
const BASE_URL = "https://open.faceit.com/data/v4"
const PLAYER_NICKNAME = "ed1v9k" // Ваш ник на FACEIT

const GAME_COUNT = 100 // Количество игр для анализа
const GAME = "cs2" // Игра для анализа

// Инициализация клиента API
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${API_KEY}` },
})

async function getPlayerId(nickname) {
  try {
    const response = await apiClient.get(`/players`, { params: { nickname } })
    return response.data.player_id
  } catch (error) {
    console.error(
      "Ошибка при получении player_id:",
      error.response?.data || error.message
    )
    process.exit(1)
  }
}

async function getMatchHistory(playerId, limit = GAME_COUNT) {
  try {
    const response = await apiClient.get(`/players/${playerId}/history`, {
      params: { game: GAME, limit },
    })
    return response.data.items || []
  } catch (error) {
    console.error(
      "Ошибка при получении истории матчей:",
      error.response?.data || error.message
    )
    return []
  }
}

async function getMatchDetails(matchId) {
  try {
    const response = await apiClient.get(`/matches/${matchId}`)
    return response.data
  } catch (error) {
    console.error(
      `Ошибка при получении данных матча ${matchId}:`,
      error.response?.data || error.message
    )
    return null
  }
}

async function checkPlayerBanned(playerId) {
  try {
    const response = await apiClient.get(`/players/${playerId}`)
    return response.data
  } catch (error) {
    console.error(
      `Ошибка при получении данных игрока:`,
      error.response?.data || error.message
    )
    return null
  }
}

async function findSmurfs() {
  try {
    const playerId = await getPlayerId(PLAYER_NICKNAME)
    const matches = await getMatchHistory(playerId)

    const matchesByPlayerMap = {}

    // Фильтруем матчи с поражением и потерей 25 ELO
    const enemyPlayers = matches.reduce((acc, match) => {
      const playerInFraction1 = match.teams.faction1.players.some(
        player => player.player_id === playerId
      )
      const playerFractionName = playerInFraction1 ? "faction1" : "faction2"
      const enemyFractionName = playerInFraction1 ? "faction2" : "faction1"

      const playerIsWon = match.results?.winner === playerFractionName
      if (playerIsWon) {
        return acc
      }

      const enemies = match.teams[enemyFractionName].players

      enemies.forEach(player => {
        const playerUrl = replaceLangPlaceholderInURL(player.faceit_url)
        const matchUrl = replaceLangPlaceholderInURL(match.faceit_url)

        const matchesByPlayer = matchesByPlayerMap[playerUrl] || []
        matchesByPlayerMap[playerUrl] = matchesByPlayer.concat(matchUrl)
      })

      return acc.concat(enemies)
    }, [])

    const uniqueEnemyPlayers = removePlayerDuplicates(enemyPlayers)

    const enemyPlayersInfo = await Promise.all(
      uniqueEnemyPlayers.map(enemyPlayer =>
        checkPlayerBanned(enemyPlayer.player_id)
      )
    )

    const smurfs = enemyPlayersInfo
      .filter(Boolean)
      .filter(player => player.games[GAME]?.faceit_elo < 1300)

    // console.log({ smurfs })
    const matchesBySmurf = smurfs.reduce((acc, smurf) => {
      const smurfUrl = replaceLangPlaceholderInURL(smurf.faceit_url)

      acc[smurfUrl] = matchesByPlayerMap[smurfUrl]

      return acc
    }, {})
    console.table(matchesBySmurf)
    return smurfs
  } catch (error) {
    console.error("Произошла ошибка:", error.message)
  }
}

findSmurfs()

function removePlayerDuplicates(array) {
  const seenPlayerIds = new Set() // Множество для отслеживания уникальных player_id

  return array.filter(item => {
    if (seenPlayerIds.has(item.player_id)) {
      // Если player_id уже встречался, пропускаем этот объект
      return false
    }
    // Добавляем player_id в множество и оставляем объект
    seenPlayerIds.add(item.player_id)
    return true
  })
}

function replaceLangPlaceholderInURL(str) {
  return str.replace("{lang}", "en")
}
