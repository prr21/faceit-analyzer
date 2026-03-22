import type { TeamDropPickStats, PlayerDropPickStats } from "../../types"
import { BanPickChart } from "../charts/BanPickChart"
import { DeciderWinRateChart } from "../charts/DeciderWinRateChart"

interface BanPickTabProps {
  type: "team" | "player"
  name: string
  stats: TeamDropPickStats | PlayerDropPickStats
  isDark: boolean
}

export function BanPickTab({ type, name, stats, isDark }: BanPickTabProps) {
  if (type === "team") {
    const teamStats = stats as TeamDropPickStats
    return (
      <div className="py-5">
        <BanPickChart title={`Баны и пики \u2014 ${name}`} factionStats={teamStats.target} decider={teamStats.decider} isDark={isDark} />
        <h2 className="mt-5 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">Противники</h2>
        <BanPickChart title="Баны и пики \u2014 Противники" factionStats={teamStats.enemy} decider={teamStats.decider} isDark={isDark} />
        {Object.keys(teamStats.deciderWinRate).length > 0 && (
          <>
            <h2 className="mt-5 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">Десайдер \u2014 винрейт</h2>
            <DeciderWinRateChart deciderWinRate={teamStats.deciderWinRate} isDark={isDark} />
          </>
        )}
      </div>
    )
  }

  const playerStats = stats as PlayerDropPickStats
  return (
    <div className="py-5">
      <BanPickChart title={`Баны и пики \u2014 ${name}`} factionStats={playerStats.stats} decider={playerStats.decider} isDark={isDark} />
      {Object.keys(playerStats.deciderWinRate).length > 0 && (
        <>
          <h2 className="mt-5 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">Десайдер \u2014 винрейт</h2>
          <DeciderWinRateChart deciderWinRate={playerStats.deciderWinRate} isDark={isDark} />
        </>
      )}
    </div>
  )
}
