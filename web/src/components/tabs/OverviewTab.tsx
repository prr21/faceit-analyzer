import type { TeamDropPickStats, PlayerDropPickStats } from "../../types"
import { SummaryCards } from "../ui/SummaryCards"
import { CompetitionPieChart } from "../charts/CompetitionPieChart"

interface OverviewTabProps {
  stats: TeamDropPickStats | PlayerDropPickStats
}

export function OverviewTab({ stats }: OverviewTabProps) {
  const hasComp = Object.keys(stats.competitionStats).length > 0

  return (
    <div className="py-5">
      <SummaryCards
        totalMatches={stats.allCount}
        analyzedMatches={stats.count}
        avgElo={stats.avgElo}
        overallWinRate={stats.mapWinRate}
        earliestGame={stats.earliestGame}
        latestGame={stats.latestGame}
      />
      {hasComp && (
        <>
          <h2 className="mt-6">Распределение по типу</h2>
          <CompetitionPieChart compStats={stats.competitionStats} />
        </>
      )}
    </div>
  )
}
