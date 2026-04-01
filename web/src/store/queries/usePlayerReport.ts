import { useQuery } from "@tanstack/react-query"
import type { ReportData } from "@/types"
import { fetchPlayerReport } from "../api/player"

/**
 * Хук для загрузки отчёта игрока.
 * В DEV без VITE_API_URL — возвращает мок-данные с задержкой.
 * В проде — запрос к /api/player/:nickname.
 */
export function usePlayerReport(nickname: string) {
  return useQuery<ReportData>({
    queryKey: ["player-report", nickname],
    queryFn: () => fetchPlayerReport(nickname),
    enabled: !!nickname,
  })
}
