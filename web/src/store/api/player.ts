import type { ReportData } from "@/types"
import { IS_MOCK, apiFetch } from "./client"
import { mockFetchPlayerReport, mockSearchPlayers } from "./mock"
import type { SearchResult } from "./mock"

/** Загрузка отчёта игрока по никнейму */
export async function fetchPlayerReport(
  nickname: string,
): Promise<ReportData> {
  if (IS_MOCK) {
    return mockFetchPlayerReport(nickname)
  }
  return apiFetch<ReportData>(`/api/player/${encodeURIComponent(nickname)}/analysis`)
}

/** Поиск игроков по запросу */
export async function searchPlayers(
  query: string,
): Promise<SearchResult[]> {
  if (IS_MOCK) {
    return mockSearchPlayers(query)
  }
  return apiFetch<SearchResult[]>(
    `/api/search?q=${encodeURIComponent(query)}`,
  )
}

export type { SearchResult }
