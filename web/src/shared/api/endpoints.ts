import type {
  SearchPlayerResult,
  SearchTeamResult,
  TeamInfo,
  TeamDropPickStats,
  VoiceStatusDto,
  MatchAnalysisResult,
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

/** Пре-матч анализ комнаты: обе команды + рекомендации */
export async function fetchMatchAnalysis(matchId: string): Promise<MatchAnalysisResult> {
  return apiFetch<MatchAnalysisResult>(
    `/api/match/${encodeURIComponent(matchId)}/analysis`,
  )
}

/** Запуск извлечения голосов матча */
export async function startVoiceExtraction(matchId: string): Promise<VoiceStatusDto> {
  return apiFetch<VoiceStatusDto>(
    `/api/match/${encodeURIComponent(matchId)}/voices`,
    { method: "POST" },
  )
}

/** Статус извлечения голосов + список аудио */
export async function getVoiceStatus(matchId: string): Promise<VoiceStatusDto> {
  return apiFetch<VoiceStatusDto>(`/api/match/${encodeURIComponent(matchId)}/voices`)
}

export type { SearchPlayerResult, SearchTeamResult, TeamInfo }
