import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { VoiceStatusDto } from "@/shared/types"
import { getVoiceStatus, startVoiceExtraction } from "@/shared/api/endpoints"

const queryKey = (matchId: string) => ["voices", matchId]

const ACTIVE_STATUSES = new Set(["pending", "extracting"])

/** Статус голосов матча: поллинг каждые 2с, пока идёт извлечение */
export function useVoiceStatus(matchId: string) {
  return useQuery<VoiceStatusDto>({
    queryKey: queryKey(matchId),
    queryFn: () => getVoiceStatus(matchId),
    refetchInterval: query =>
      query.state.data && ACTIVE_STATUSES.has(query.state.data.status) ? 2000 : false,
  })
}

/** Мутация запуска извлечения: ответ сразу кладётся в кеш статуса */
export function useStartVoiceExtraction(matchId: string) {
  const qc = useQueryClient()
  return useMutation<VoiceStatusDto, Error>({
    mutationFn: () => startVoiceExtraction(matchId),
    onSuccess: data => qc.setQueryData(queryKey(matchId), data),
  })
}
