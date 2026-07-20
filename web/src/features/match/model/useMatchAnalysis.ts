import { useQuery } from "@tanstack/react-query"
import { fetchMatchAnalysis } from "@/shared/api/endpoints"
import type { MatchAnalysisResult } from "@/shared/types"

/**
 * Автозапуск пре-матч анализа комнаты при открытии страницы.
 * Результат неизменяем для сыгранного вето — держим в кеше без рефетча.
 */
export function useMatchAnalysis(matchId: string | undefined) {
  return useQuery<MatchAnalysisResult>({
    queryKey: ["match-analysis", matchId],
    queryFn: () => fetchMatchAnalysis(matchId!),
    enabled: Boolean(matchId),
    staleTime: Infinity,
    retry: false,
  })
}
