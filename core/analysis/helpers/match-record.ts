import type {
  FaceitMatchDetail,
  FaceitMatchStats,
  MatchRecord,
} from "../../types/index"
import type { FactionKey } from "../../types/analysis"
import { replaceLangPlaceholder } from "../../infra/dedup"

/** Извлекает статистику конкретного игрока из match stats для конкретной карты (roundIndex) */
function extractPlayerStats(
  stats: FaceitMatchStats | null | undefined,
  playerId: string,
  roundIndex: number,
): Partial<Pick<MatchRecord, "kills" | "deaths" | "assists" | "headshots" | "headshotPercent" | "adr" | "kr" | "kdRatio">> {
  if (!stats?.rounds?.[roundIndex]) return {}
  const round = stats.rounds[roundIndex]
  for (const team of round.teams) {
    for (const player of team.players) {
      if (player.player_id === playerId) {
        const s = player.player_stats
        return {
          kills: parseInt(s["Kills"]) || undefined,
          deaths: parseInt(s["Deaths"]) || undefined,
          assists: parseInt(s["Assists"]) || undefined,
          headshots: parseInt(s["Headshots"]) || undefined,
          headshotPercent: parseFloat(s["Headshots %"]) || undefined,
          adr: parseFloat(s["ADR"]) || undefined,
          kr: parseFloat(s["K/R Ratio"]) || undefined,
          kdRatio: parseFloat(s["K/D Ratio"]) || undefined,
        }
      }
    }
  }
  return {}
}

export function buildMatchRecord(
  match: FaceitMatchDetail,
  targetFaction: FactionKey,
  mapName: string,
  mapIndex: number,
  won: boolean,
  matchStats?: FaceitMatchStats | null,
  playerId?: string,
): MatchRecord {
  const opponentFaction: FactionKey = targetFaction === "faction1" ? "faction2" : "faction1"
  const opponentTeam = match.teams[opponentFaction]
  const targetTeam = match.teams[targetFaction]

  let mapScore = "\u2014"
  if (match.detailed_results?.[mapIndex]) {
    const dr = match.detailed_results[mapIndex]
    const ts = dr.factions[targetFaction]?.score ?? 0
    const os = dr.factions[opponentFaction]?.score ?? 0
    mapScore = `${ts}:${os}`
  } else if (match.results?.score) {
    const ts = match.results.score[targetFaction] ?? 0
    const os = match.results.score[opponentFaction] ?? 0
    mapScore = `${ts}:${os}`
  }

  let matchScore: string | undefined
  if (match.best_of > 1 && match.results?.score) {
    const ts = match.results.score[targetFaction] ?? 0
    const os = match.results.score[opponentFaction] ?? 0
    matchScore = `${ts}:${os}`
  }

  const faceitUrl = match.faceit_url
    ? replaceLangPlaceholder(match.faceit_url)
    : `https://www.faceit.com/en/cs2/room/${match.match_id}`

  const playerStatsData = playerId ? extractPlayerStats(matchStats, playerId, mapIndex) : {}

  let opponentTeamUrl: string | undefined
  if (opponentTeam.faction_id && opponentTeam.type === "premade") {
    opponentTeamUrl = `https://www.faceit.com/en/teams/${opponentTeam.faction_id}`
  }

  let competitionUrl: string | undefined
  if (match.competition_id && match.competition_type && match.competition_type !== "matchmaking") {
    competitionUrl = `https://www.faceit.com/en/championship/${match.competition_id}`
  }

  return {
    matchId: match.match_id,
    date: match.started_at,
    faceitUrl,
    won,
    mapScore,
    matchScore,
    bestOf: match.best_of,
    opponentName: opponentTeam.name || "\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u0439",
    opponentTeamUrl,
    targetRating: targetTeam.stats?.rating,
    opponentRating: opponentTeam.stats?.rating,
    competitionName: match.competition_name,
    competitionUrl,
    ...playerStatsData,
  }
}

export function addMatchRecord(
  records: Record<string, MatchRecord[]>,
  mapName: string,
  record: MatchRecord,
): void {
  if (!records[mapName]) records[mapName] = []
  records[mapName].push(record)
}
