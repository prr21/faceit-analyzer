import type {
  SearchPlayerResult,
  SearchTeamResult,
  TeamInfo,
  TeamDropPickStats,
  VoiceStatusDto,
  MatchAnalysisResult,
} from "@faceit/core"
import type { ReportData } from "@/shared/types"
import { apiFetch, API_BASE } from "./client"

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

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

/**
 * AI-чат по матчу со стримингом (SSE). Токены приходят через onToken.
 * Отдельно от apiFetch — тот JSON-парсит, а тут читаем поток.
 */
export async function streamMatchChat(
  matchId: string,
  result: MatchAnalysisResult,
  messages: ChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/match/${encodeURIComponent(matchId)}/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result, messages }),
      signal,
    },
  )

  if (!response.ok || !response.body) {
    let message = `Ошибка сервера: ${response.status}`
    try {
      const body = (await response.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // тело не JSON — оставляем generic
    }
    throw new Error(message)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split("\n\n")
    buffer = events.pop() ?? ""
    for (const evt of events) {
      let event = "message"
      let data = ""
      for (const line of evt.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim()
        else if (line.startsWith("data:")) data += line.slice(5).trim()
      }
      if (data === "" || data === "[DONE]") continue
      let parsed: { t?: string; error?: string }
      try {
        parsed = JSON.parse(data)
      } catch {
        continue
      }
      if (event === "error") throw new Error(parsed.error || "Ошибка AI")
      if (parsed.t) onToken(parsed.t)
    }
  }
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
