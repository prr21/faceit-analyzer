import type { TeamDropPickStats, PlayerDropPickStats } from "../../types"
import { SummaryCards } from "../ui/SummaryCards"
import { CompetitionPieChart } from "../charts/CompetitionPieChart"

interface OverviewTabProps {
  stats: TeamDropPickStats | PlayerDropPickStats
  mode?: "leader" | "all"
}

function isPlayerStats(stats: TeamDropPickStats | PlayerDropPickStats): stats is PlayerDropPickStats {
  return "leaderMapWinRate" in stats
}

export function OverviewTab({ stats, mode }: OverviewTabProps) {
  const isLeaderMode = mode === "leader" && isPlayerStats(stats)
  const hasComp = Object.keys(stats.competitionStats).length > 0

  return (
    <div className="py-5">
      <SummaryCards
        totalMatches={isLeaderMode ? stats.count : stats.allCount}
        analyzedMatches={stats.count}
        avgElo={stats.avgElo}
        overallWinRate={isLeaderMode ? stats.leaderMapWinRate : stats.mapWinRate}
        earliestGame={stats.earliestGame}
        latestGame={stats.latestGame}
      />
      {!isLeaderMode && hasComp && (
        <>
          <h2 className="mt-6">Распределение по типу</h2>
          <CompetitionPieChart compStats={stats.competitionStats} />
        </>
      )}
    </div>
  )
}
