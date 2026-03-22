import type { TeamDropPickStats, PlayerDropPickStats } from "../../types"
import { BanPickChart } from "../charts/BanPickChart"
import { DeciderWinRateChart } from "../charts/DeciderWinRateChart"

interface BanPickTabProps {
  type: "team" | "player"
  name: string
  stats: TeamDropPickStats | PlayerDropPickStats
}

export function BanPickTab({ type, name, stats }: BanPickTabProps) {
  if (type === "team") {
    const teamStats = stats as TeamDropPickStats
    return (
      <div className="py-5">
        <BanPickChart title={`Баны и пики \u2014 ${name}`} factionStats={teamStats.target} decider={teamStats.decider} />
        <h2 className="mt-8 border-t border-gray-200 pt-4">Противники</h2>
        <BanPickChart title="Баны и пики \u2014 Противники" factionStats={teamStats.enemy} decider={teamStats.decider} />
        {Object.keys(teamStats.deciderWinRate).length > 0 && (
          <>
            <h2 className="mt-8 border-t border-gray-200 pt-4">Десайдер \u2014 винрейт</h2>
            <DeciderWinRateChart deciderWinRate={teamStats.deciderWinRate} />
          </>
        )}
      </div>
    )
  }

  const playerStats = stats as PlayerDropPickStats
  return (
    <div className="py-5">
      <BanPickChart title={`Баны и пики \u2014 ${name}`} factionStats={playerStats.stats} decider={playerStats.decider} />
      {Object.keys(playerStats.deciderWinRate).length > 0 && (
        <>
          <h2 className="mt-8 border-t border-gray-200 pt-4">Десайдер \u2014 винрейт</h2>
          <DeciderWinRateChart deciderWinRate={playerStats.deciderWinRate} />
        </>
      )}
    </div>
  )
}
