import type { TeamDropPickStats, PlayerDropPickStats } from "@/shared/types"
import { RadarChart } from "../charts/RadarChart"

interface RadarTabProps {
  stats: TeamDropPickStats | PlayerDropPickStats
  mode?: "leader" | "all"
  isDark: boolean
}

function isPlayerStats(stats: TeamDropPickStats | PlayerDropPickStats): stats is PlayerDropPickStats {
  return "leaderMapWinRate" in stats
}

export function RadarTab({ stats, mode, isDark }: RadarTabProps) {
  // Выбор данных в зависимости от режима (аналог WinrateTab.tsx)
  const useLeaderData = mode === "leader" && isPlayerStats(stats)
  const winRate = useLeaderData ? stats.leaderMapWinRate : stats.mapWinRate
  const matchRecords = useLeaderData ? stats.leaderMatchRecords : stats.matchRecords

  const hasData = Object.keys(winRate).length > 0

  if (!hasData) {
    return <p className="py-5 text-gray-500 dark:text-gray-400">Нет данных для радарной диаграммы</p>
  }

  return (
    <div className="py-5">
      <RadarChart
        mapWinRate={winRate}
        matchRecords={matchRecords}
        isDark={isDark}
      />
    </div>
  )
}
