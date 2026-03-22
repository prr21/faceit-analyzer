import type { TeamDropPickStats, PlayerDropPickStats } from "../../types"
import { WinRateChart } from "../charts/WinRateChart"
import { CompetitionChart } from "../charts/CompetitionChart"
import { WinRateTable } from "../ui/WinRateTable"
import { FavoriteUnderdogCards } from "../ui/FavoriteUnderdogCards"

interface WinrateTabProps {
  stats: TeamDropPickStats | PlayerDropPickStats
}

export function WinrateTab({ stats }: WinrateTabProps) {
  const hasWinRate = Object.keys(stats.mapWinRate).length > 0
  const hasFU = stats.favoriteUnderdog.asFavorite.total > 0 || stats.favoriteUnderdog.asUnderdog.total > 0
  const hasComp = Object.keys(stats.competitionStats).length > 0

  return (
    <div className="py-5">
      {hasWinRate ? (
        <>
          <WinRateTable winRate={stats.mapWinRate} matchRecords={stats.matchRecords} />
          <WinRateChart winRate={stats.mapWinRate} />
        </>
      ) : (
        <p className="text-gray-500">Нет данных о винрейте</p>
      )}

      {hasFU && (
        <>
          <h2 className="mt-8 border-t border-gray-200 pt-4">Фаворит vs Андердог</h2>
          <FavoriteUnderdogCards stats={stats.favoriteUnderdog} />
        </>
      )}

      {hasComp && (
        <>
          <h2 className="mt-8 border-t border-gray-200 pt-4">По типу соревнования</h2>
          <CompetitionChart compStats={stats.competitionStats} />
        </>
      )}
    </div>
  )
}
