import { useState, useMemo } from "react"
import type { TeamDropPickStats, PlayerDropPickStats, TrendPeriod } from "../../types"
import { TrendChart } from "../charts/TrendChart"
import { WinRateTrendChart } from "../charts/WinRateTrendChart"
import { MatchCountChart } from "../charts/MatchCountChart"
import { EloChart } from "../charts/EloChart"

const PHASES = [
  { key: "firstBan" as const, label: "Первый бан" },
  { key: "secondBan" as const, label: "Второй бан" },
  { key: "thirdBan" as const, label: "Последний бан" },
  { key: "firstPick" as const, label: "Пик (BO3)" },
]

interface TrendsTabProps {
  stats: TeamDropPickStats | PlayerDropPickStats
  mode?: "leader" | "all"
}

export function TrendsTab({ stats, mode }: TrendsTabProps) {
  const [phase, setPhase] = useState<"firstBan" | "firstPick" | "secondBan" | "thirdBan">("firstBan")

  const isLeaderMode = mode === "leader"

  // В leader mode подменяем winRate/matchCount на leader-specific данные
  const displayTrends: TrendPeriod[] = useMemo(() => {
    if (!isLeaderMode) return stats.trends
    return stats.trends.map(t => ({
      ...t,
      mapWinRate: t.leaderMapWinRate,
      matchCount: t.leaderMatchCount,
    }))
  }, [stats.trends, isLeaderMode])

  const hasTrends = displayTrends.length >= 2
  const hasElo = stats.eloHistory.length >= 2

  return (
    <div className="py-5">
      {hasTrends ? (
        <>
          {/* Ban/pick тренды — только в leader mode или для team */}
          {mode !== "all" && (
            <>
              <h2>Тренды банов/пиков</h2>
              <div className="my-2.5">
                <select
                  value={phase}
                  onChange={e => setPhase(e.target.value as typeof phase)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                >
                  {PHASES.map(p => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>

              <TrendChart
                title={PHASES.find(p => p.key === phase)!.label}
                trends={stats.trends}
                dataKey={phase}
              />
            </>
          )}

          <h2 className={mode !== "all" ? "mt-8 border-t border-gray-200 pt-4" : ""}>
            Тренды винрейта
          </h2>
          <WinRateTrendChart trends={displayTrends} />

          <h2 className="mt-8 border-t border-gray-200 pt-4">Количество матчей</h2>
          <MatchCountChart trends={displayTrends} />
        </>
      ) : (
        <p className="text-gray-500">Недостаточно данных для трендов (нужно минимум 2 месяца)</p>
      )}

      {/* ELO — только в all mode или для team (не для leader) */}
      {!isLeaderMode && hasElo && (
        <>
          <h2 className="mt-8 border-t border-gray-200 pt-4">Динамика ELO</h2>
          <EloChart eloHistory={stats.eloHistory} />
        </>
      )}
    </div>
  )
}
