import type {
  SearchPlayerResult,
  SearchTeamResult,
  TeamInfo,
  TeamDropPickStats,
} from "@faceit/core"
import type { ReportData } from "@/shared/types"
import { apiFetch } from "./client"

export interface SearchAllResult {
  players: SearchPlayerResult[]
  teams: SearchTeamResult[]
}

/** Загрузка отчёта игрока по никнейму */
export async function fetchPlayerReport(
  nickname: string,
): Promise<ReportData> {
  return apiFetch<ReportData>(`/api/player/${encodeURIComponent(nickname)}/analysis`)
}

/** Совмещённый поиск по игрокам и командам */
export async function searchAll(query: string): Promise<SearchAllResult> {
  return apiFetch<SearchAllResult>(
    `/api/search?q=${encodeURIComponent(query)}`,
  )
}

/** Ростер команды по UUID */
export async function fetchTeamRoster(teamId: string): Promise<TeamInfo> {
  return apiFetch<TeamInfo>(`/api/team/${encodeURIComponent(teamId)}`)
}

/** Запуск анализа команды по выбранным игрокам */
export async function analyzeTeam(
  teamName: string,
  playerIds: string[],
): Promise<ReportData> {
  // Сервер возвращает TeamAnalysisResult = { stats }, оборачиваем в ReportData,
  // чтобы ReportView корректно различал team/player по полю `type`.
  const result = await apiFetch<{ stats: TeamDropPickStats }>(`/api/team/analysis`, {
    method: "POST",
    body: JSON.stringify({ teamName, playerIds }),
  })
  return { type: "team", name: teamName, stats: result.stats }
}

export type { SearchPlayerResult, SearchTeamResult, TeamInfo }
