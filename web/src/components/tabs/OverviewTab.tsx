import type { TeamDropPickStats, PlayerDropPickStats } from "../../types"
import { SummaryCards } from "../ui/SummaryCards"
import { CompetitionPieChart } from "../charts/CompetitionPieChart"
import { SkillLevelBar } from "../ui/SkillLevelBar"
import { RecentPerformance } from "../ui/RecentPerformance"
import { LeadershipImpact } from "../ui/LeadershipImpact"

interface OverviewTabProps {
  stats: TeamDropPickStats | PlayerDropPickStats
  mode?: "leader" | "all"
  isDark: boolean
}

function isPlayerStats(stats: TeamDropPickStats | PlayerDropPickStats): stats is PlayerDropPickStats {
  return "leaderMapWinRate" in stats
}

export function OverviewTab({ stats, mode, isDark }: OverviewTabProps) {
  const isLeaderMode = mode === "leader" && isPlayerStats(stats)
  const hasComp = Object.keys(stats.competitionStats).length > 0

  const playerProfile = isPlayerStats(stats) ? stats.playerProfile : undefined
  const matchRecords = isLeaderMode && isPlayerStats(stats) ? stats.leaderMatchRecords : stats.matchRecords

  return (
    <div className="py-5">
      {/* Skill Level Bar — только для player с профилем */}
      {playerProfile && playerProfile.currentElo > 0 && (
        <SkillLevelBar currentElo={playerProfile.currentElo} skillLevel={playerProfile.skillLevel} />
      )}

      <SummaryCards
        totalMatches={isLeaderMode ? stats.count : stats.allCount}
        analyzedMatches={stats.count}
        avgElo={stats.avgElo}
        overallWinRate={isLeaderMode && isPlayerStats(stats) ? stats.leaderMapWinRate : stats.mapWinRate}
        earliestGame={stats.earliestGame}
        latestGame={stats.latestGame}
        longestWinStreak={isPlayerStats(stats) ? stats.longestWinStreak : undefined}
        matchRecords={matchRecords}
      />

      {/* Эффект лидерства — только для player в "Все матчи" */}
      {!isLeaderMode && isPlayerStats(stats) && Object.keys(stats.leaderMatchRecords).length > 0 && (
        <>
          <h2 className="mt-4 sm:mt-6">Эффект лидерства</h2>
          <LeadershipImpact
            matchRecords={stats.matchRecords}
            leaderMatchRecords={stats.leaderMatchRecords}
          />
        </>
      )}

      {/* Recent Performance — для all mode или team */}
      {!isLeaderMode && (
        <RecentPerformance
          matchRecords={stats.matchRecords}
          eloHistory={stats.eloHistory}
        />
      )}

      {!isLeaderMode && hasComp && (
        <>
          <h2 className="mt-4 sm:mt-6">Распределение по типу</h2>
          <CompetitionPieChart compStats={stats.competitionStats} isDark={isDark} />
        </>
      )}
    </div>
  )
}
