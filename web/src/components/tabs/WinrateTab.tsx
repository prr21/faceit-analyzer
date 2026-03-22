import type { TeamDropPickStats, PlayerDropPickStats } from "../../types"
import { WinRateChart } from "../charts/WinRateChart"
import { CompetitionChart } from "../charts/CompetitionChart"
import { WinRateTable } from "../ui/WinRateTable"
import { FavoriteUnderdogCards } from "../ui/FavoriteUnderdogCards"

interface WinrateTabProps {
  stats: TeamDropPickStats | PlayerDropPickStats
  mode?: "leader" | "all"
}

function isPlayerStats(stats: TeamDropPickStats | PlayerDropPickStats): stats is PlayerDropPickStats {
  return "leaderMapWinRate" in stats
}

export function WinrateTab({ stats, mode }: WinrateTabProps) {
  // В leader mode для player — показываем leader-only данные
  const useLeaderData = mode === "leader" && isPlayerStats(stats)
  const winRate = useLeaderData ? stats.leaderMapWinRate : stats.mapWinRate
  const matchRecords = useLeaderData ? stats.leaderMatchRecords : stats.matchRecords

  const hasWinRate = Object.keys(winRate).length > 0
  const hasFU = stats.favoriteUnderdog.asFavorite.total > 0 || stats.favoriteUnderdog.asUnderdog.total > 0
  const hasComp = Object.keys(stats.competitionStats).length > 0

  // Фаворит/Андердог и Competition — только в all mode или для team
  const showExtras = mode !== "leader"

  return (
    <div className="py-5">
      {hasWinRate ? (
        <>
          <WinRateTable winRate={winRate} matchRecords={matchRecords} />
          <WinRateChart winRate={winRate} />
        </>
      ) : (
        <p className="text-gray-500">Нет данных о винрейте</p>
      )}

      {showExtras && hasFU && (
        <>
          <h2 className="mt-8 border-t border-gray-200 pt-4">Фаворит vs Андердог</h2>
          <FavoriteUnderdogCards stats={stats.favoriteUnderdog} />
        </>
      )}

      {showExtras && hasComp && (
        <>
          <h2 className="mt-8 border-t border-gray-200 pt-4">По типу соревнования</h2>
          <CompetitionChart compStats={stats.competitionStats} />
        </>
      )}
    </div>
  )
}
