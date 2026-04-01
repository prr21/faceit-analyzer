import type { ReportData } from "@/types"
import { mockPlayerReport } from "@/__tests__/fixtures/mockData"

export interface SearchResult {
  player_id: string
  nickname: string
  avatar: string
  country: string
  skill_level: number
}

// Имитация сетевой задержки
function delay(ms = 400): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Мок: загрузка отчёта игрока */
export async function mockFetchPlayerReport(
  nickname: string,
): Promise<ReportData> {
  await delay()

  // Возвращаем мок-данные с подставленным никнеймом
  return {
    ...mockPlayerReport,
    name: nickname,
    stats: {
      ...mockPlayerReport.stats,
      playerProfile: {
        ...(mockPlayerReport.stats as { playerProfile?: { nickname: string; avatar?: string; skillLevel: number; currentElo: number; country?: string } }).playerProfile!,
        nickname,
      },
    },
  }
}

/** Мок: поиск игроков */
export async function mockSearchPlayers(
  query: string,
): Promise<SearchResult[]> {
  await delay(200)

  // Мок-список игроков для демонстрации поиска
  const mockPlayers: SearchResult[] = [
    { player_id: "1", nickname: "dErzz", avatar: "", country: "RU", skill_level: 8 },
    { player_id: "2", nickname: "ed1v9k", avatar: "", country: "RU", skill_level: 7 },
    { player_id: "3", nickname: "deNNis", avatar: "", country: "SE", skill_level: 10 },
    { player_id: "4", nickname: "developer", avatar: "", country: "US", skill_level: 5 },
  ]

  const lower = query.toLowerCase()
  return mockPlayers.filter(p => p.nickname.toLowerCase().includes(lower))
}
