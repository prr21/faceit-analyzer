import { useQuery } from "@tanstack/react-query"
import type { TeamInfo } from "@faceit/core"
import { fetchTeamRoster } from "@/shared/api/endpoints"

/** Ростер команды по UUID (для страницы выбора игроков). */
export function useTeamRoster(teamId: string | undefined) {
  return useQuery<TeamInfo>({
    queryKey: ["team-roster", teamId],
    queryFn: () => fetchTeamRoster(teamId!),
    enabled: !!teamId,
  })
}
