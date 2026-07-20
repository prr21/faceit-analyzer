import type { FaceitClient } from "../api/client"
import type { FaceitFactionPlayer, FaceitTeamFaction } from "../types/api"
import type { PlayerMapStats, TeamDropPickStats } from "../types/domain"
import type { MatchInsight } from "../types/recommendation"
import { getMatchInfo, getPlayerMapStats } from "../api/faceit-open"
import { parsePlayerMapStats } from "../analysis/player-map-stats"
import { banRate, buildMapRecommendations, pickRate } from "../analysis/recommendation"
import { fetchAndAnalyzeTeam } from "./team"
import { batchWithLimit } from "../infra/concurrency"
import { ACTIVE_MAP_POOL, DEFAULT_CONCURRENCY } from "../constants"

export interface MatchRosterPlayer {
  playerId: string
  nickname: string
  skillLevel: number
  mapStats: PlayerMapStats[]
}

export interface MapHabits {
  pickRate: number // доля пиков карты среди всех пик-событий команды, 0..1
  banRate: number // доля банов карты среди всех бан-событий команды, 0..1
}

export interface MatchTeamAnalysis {
  factionId?: string
  name: string
  leader: string
  avgElo: number
  roster: MatchRosterPlayer[]
  stats: TeamDropPickStats
  // Предрасчёт для потребителей без доступа к core (web, telegram-бот)
  mapHabits: Record<string, MapHabits>
}

export interface MatchAnalysisResult {
  matchId: string
  bestOf?: number
  competitionName?: string
  faceitUrl?: string
  teams: [MatchTeamAnalysis, MatchTeamAnalysis]
  insights: MatchInsight[]
}

function factionPlayers(faction: FaceitTeamFaction): FaceitFactionPlayer[] {
  return faction.roster ?? faction.players ?? []
}

/**
 * Полный пайплайн пре-матч анализа комнаты:
 * матч → фракции → параллельный анализ обеих команд + статистика игроков по картам → рекомендации.
 * Пустая история команды (count === 0) — не ошибка: рекомендации деградируют к «мало данных».
 */
export async function fetchAndAnalyzeMatch(
  client: FaceitClient,
  matchId: string,
  options?: {
    onProgress?: (phase: string, done: number, total: number) => void
  },
): Promise<MatchAnalysisResult> {
  const match = await getMatchInfo(client, matchId)

  const factions = [match.teams.faction1, match.teams.faction2]
  const rosters = factions.map(factionPlayers)
  if (rosters.some(r => r.length === 0)) {
    throw new Error(`В матче ${matchId} не заполнены составы команд`)
  }
  const names = factions.map((f, i) => f.name || `Команда ${i + 1}`)

  const [analyses, playersStats] = await Promise.all([
    Promise.all(
      factions.map((_, i) =>
        fetchAndAnalyzeTeam(client, rosters[i].map(p => p.player_id), names[i], {
          minPlayers: Math.min(3, rosters[i].length),
          onProgress: (done, total) => options?.onProgress?.(names[i], done, total),
        }),
      ),
    ),
    batchWithLimit(
      rosters.flat().map(p => () => getPlayerMapStats(client, p.player_id)),
      DEFAULT_CONCURRENCY,
    ),
  ])

  const mapStatsByPlayer = new Map(
    rosters.flat().map((p, i) => [p.player_id, parsePlayerMapStats(playersStats[i])]),
  )

  const teams = factions.map((faction, i) => ({
    factionId: faction.faction_id,
    name: names[i],
    leader: faction.leader,
    avgElo: analyses[i].stats.avgElo,
    roster: rosters[i].map(p => ({
      playerId: p.player_id,
      nickname: p.nickname,
      skillLevel: p.game_skill_level ?? 0,
      mapStats: mapStatsByPlayer.get(p.player_id) ?? [],
    })),
    stats: analyses[i].stats,
    mapHabits: Object.fromEntries(
      ACTIVE_MAP_POOL.map(map => [
        map,
        {
          pickRate: pickRate(analyses[i].stats.target, map),
          banRate: banRate(analyses[i].stats.target, map),
        },
      ]),
    ),
  })) as [MatchTeamAnalysis, MatchTeamAnalysis]

  const insights: MatchInsight[] = [
    buildMapRecommendations(teams[0].stats, teams[1].stats, teams[0].name, teams[1].name),
  ]

  return {
    matchId,
    bestOf: match.best_of,
    competitionName: match.competition_name,
    faceitUrl: match.faceit_url,
    teams,
    insights,
  }
}
