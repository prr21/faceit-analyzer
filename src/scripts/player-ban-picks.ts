import { FACEIT_API_KEY } from "../config.js"
import { createFaceitClient } from "../api/client.js"
import { getPlayerId, getPlayerMatches } from "../api/faceit-open.js"
import { getMatchWithVoting } from "../api/faceit-internal.js"
import {
  findMapVotingTicket,
  isExcludedMap,
  classifyVotingEntity,
  getDeciderRound,
  incrementMapCount,
} from "../utils/map-voting.js"
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

    const deciderRound = getDeciderRound(mapVoting)

    for (const entity of mapVoting.entities) {
      if (isExcludedMap(entity.guid)) continue

      const phase = classifyVotingEntity(entity, deciderRound)
      if (!phase) continue

      if (phase === "decider" || phase === "firstPick") {
        incrementMapCount(stats.play, entity.guid)
        continue
      }

      // Фазы банов: firstBan, secondBan, thirdBan
      if (entity.selected_by === teamFaction) {
        incrementMapCount(stats.bans, entity.guid)
        if (phase === "firstBan") {
          incrementMapCount(stats.banFirst, entity.guid)
        }
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
