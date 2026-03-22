import { useState } from "react"
import type { TeamDropPickStats, PlayerDropPickStats } from "../../types"
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
}

export function TrendsTab({ stats }: TrendsTabProps) {
  const [phase, setPhase] = useState<"firstBan" | "firstPick" | "secondBan" | "thirdBan">("firstBan")

  const hasTrends = stats.trends.length >= 2
  const hasElo = stats.eloHistory.length >= 2

  return (
    <div className="py-5">
      {hasTrends ? (
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

          <h2 className="mt-8 border-t border-gray-200 pt-4">Тренды винрейта</h2>
          <WinRateTrendChart trends={stats.trends} />

          <h2 className="mt-8 border-t border-gray-200 pt-4">Количество матчей</h2>
          <MatchCountChart trends={stats.trends} />
        </>
      ) : (
        <p className="text-gray-500">Недостаточно данных для трендов (нужно минимум 2 месяца)</p>
      )}

      {hasElo && (
        <>
          <h2 className="mt-8 border-t border-gray-200 pt-4">Динамика ELO</h2>
          <EloChart eloHistory={stats.eloHistory} />
        </>
      )}
    </div>
  )
}
