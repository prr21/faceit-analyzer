import type { TeamDropPickStats, PlayerDropPickStats } from "../../types"
import { WinRateChart } from "../charts/WinRateChart"
import { CompetitionChart } from "../charts/CompetitionChart"
import { WinRateTable } from "../ui/WinRateTable"
import { FavoriteUnderdogCards } from "../ui/FavoriteUnderdogCards"
import { OpponentTable } from "../ui/OpponentTable"

interface WinrateTabProps {
  stats: TeamDropPickStats | PlayerDropPickStats
  mode?: "leader" | "all"
  isDark: boolean
}

function isPlayerStats(stats: TeamDropPickStats | PlayerDropPickStats): stats is PlayerDropPickStats {
  return "leaderMapWinRate" in stats
}

export function WinrateTab({ stats, mode, isDark }: WinrateTabProps) {
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
          <WinRateChart winRate={winRate} isDark={isDark} />
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Нет данных о винрейте</p>
      )}

      {showExtras && hasFU && (
        <>
          <h2 className="mt-5 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">Фаворит vs Андердог</h2>
          <FavoriteUnderdogCards stats={stats.favoriteUnderdog} />
        </>
      )}

      {showExtras && hasComp && (
        <>
          <h2 className="mt-5 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">По типу соревнования</h2>
          <CompetitionChart compStats={stats.competitionStats} isDark={isDark} />
        </>
      )}

      {showExtras && Object.keys(matchRecords).length > 0 && (
        <>
          <h2 className="mt-5 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">Против противников</h2>
          <OpponentTable matchRecords={matchRecords} />
        </>
      )}
    </div>
  )
}
