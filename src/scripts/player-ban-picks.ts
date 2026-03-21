import { FACEIT_API_KEY } from "../config.js"
import { createFaceitClient } from "../api/client.js"
import { getPlayerId, getPlayerMatches } from "../api/faceit-open.js"
import { getMatchWithVoting } from "../api/faceit-internal.js"
import { findMapVotingTicket, isExcludedMap, incrementMapCount } from "../utils/map-voting.js"
import type { FaceitMatchDetail, PlayerDropPickStats, VotingPayload } from "../types/faceit.js"

const PLAYER_NICKNAME = process.argv[2] || "dErzz"

const client = createFaceitClient(FACEIT_API_KEY)

function analyzeMapBans(
  matchesData: Array<{ match: FaceitMatchDetail; history: VotingPayload | null }>,
  playerId: string,
): PlayerDropPickStats {
  const stats: PlayerDropPickStats = {
    bans: {},
    play: {},
    banFirst: {},
  }

  for (const { match, history } of matchesData) {
    if (!history) {
      if (!match.voting) continue
      for (const mapName of match.voting.map.pick) {
        incrementMapCount(stats.play, mapName)
      }
      continue
    }

    const isFaction1Leader = match.teams.faction1.leader === playerId
    const isFaction2Leader = match.teams.faction2.leader === playerId

    if (!isFaction1Leader && !isFaction2Leader) continue

    const teamFaction = isFaction1Leader ? "faction1" : "faction2"

    const mapVoting = findMapVotingTicket(history)
    if (!mapVoting) continue

    for (const entity of mapVoting.entities) {
      const { guid, status, selected_by, round } = entity

      if (isExcludedMap(guid)) continue

      if (selected_by === teamFaction && status === "drop") {
        incrementMapCount(stats.bans, guid)
        if (round === 1 || round === 2) {
          incrementMapCount(stats.banFirst, guid)
        }
      }

      if (status === "pick") {
        incrementMapCount(stats.play, guid)
      }
    }
  }

  return stats
}

async function main() {
  const playerId = await getPlayerId(client, PLAYER_NICKNAME)

  const matches = await getPlayerMatches(client, playerId)
  const matchIds = matches.map(m => m.match_id)

  const matchesData = await Promise.all(
    matchIds.map(matchId => getMatchWithVoting(client, matchId)),
  )

  const bans = analyzeMapBans(matchesData, playerId)

  console.log(`Карты, забаненные игроком ${PLAYER_NICKNAME}:`)
  console.table({
    "Количество банов": bans.bans,
    "Количество инста банов": bans.banFirst,
    "Количество сыгранных": bans.play,
  })
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
