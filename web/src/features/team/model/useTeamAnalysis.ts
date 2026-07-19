import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ReportData } from "@/shared/types"
import { analyzeTeam } from "@/shared/api/endpoints"

const queryKey = (teamId: string | undefined) => ["team-analysis", teamId]

/**
 * Мутация анализа команды. Успешный результат кладётся в query cache
 * по ключу ["team-analysis", teamId], откуда его читает страница анализа.
 */
export function useAnalyzeTeamMutation(teamId: string | undefined) {
  const qc = useQueryClient()
  return useMutation<ReportData, Error, { teamName: string; playerIds: string[] }>({
    mutationFn: ({ teamName, playerIds }) => analyzeTeam(teamName, playerIds),
    onSuccess: (data) => {
      if (teamId) qc.setQueryData(queryKey(teamId), data)
    },
  })
}

/** Чтение ранее рассчитанного анализа команды из кеша. */
export function useCachedTeamAnalysis(teamId: string | undefined) {
  return useQuery<ReportData>({
    queryKey: queryKey(teamId),
    enabled: false, // данные попадают сюда только из мутации
  })
}
