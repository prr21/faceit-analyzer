import { useState, useMemo } from "react"
import type { MatchRecord } from "../../types"
import { getStatColor } from "../../utils/colors"

interface OpponentTableProps {
  matchRecords: Record<string, MatchRecord[]>
}

interface OpponentStats {
  name: string
  url?: string
  wins: number
  losses: number
  total: number
  winRate: number
  avgKd: number | null
}

const TH = "px-2 sm:px-3 py-1.5 text-center text-sm font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
const TD = "px-2 sm:px-3 py-1.5 text-center text-sm border border-gray-200 dark:border-gray-700"

export function OpponentTable({ matchRecords }: OpponentTableProps) {
  const [showAll, setShowAll] = useState(false)

  const opponents = useMemo(() => {
    const map = new Map<string, { url?: string; wins: number; losses: number; kdSum: number; kdCount: number }>()

    for (const records of Object.values(matchRecords)) {
      for (const r of records) {
        let entry = map.get(r.opponentName)
        if (!entry) {
          entry = { url: r.opponentTeamUrl, wins: 0, losses: 0, kdSum: 0, kdCount: 0 }
          map.set(r.opponentName, entry)
        }
        if (r.won) entry.wins++
        else entry.losses++
        if (r.kdRatio !== undefined) {
          entry.kdSum += r.kdRatio
          entry.kdCount++
        }
      }
    }

    const result: OpponentStats[] = []
    for (const [name, e] of map) {
      const total = e.wins + e.losses
      result.push({
        name,
        url: e.url,
        wins: e.wins,
        losses: e.losses,
        total,
        winRate: Math.round((e.wins / total) * 100),
        avgKd: e.kdCount > 0 ? +(e.kdSum / e.kdCount).toFixed(2) : null,
      })
    }

    return result.sort((a, b) => b.total - a.total)
  }, [matchRecords])

  if (opponents.length === 0) return null

  const visible = showAll ? opponents : opponents.slice(0, 10)
  const hasMore = opponents.length > 10

  return (
    <div className="overflow-x-auto my-3">
      <table className="border-collapse w-full">
        <thead>
          <tr>
            <th className={`${TH} text-left`}>Противник</th>
            <th className={TH}>Игр</th>
            <th className={TH}>W</th>
            <th className={TH}>L</th>
            <th className={TH}>Win%</th>
            <th className={TH}>K/D</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(opp => {
            const rowBg = opp.winRate > 60
              ? "bg-green-50/60 dark:bg-green-900/15"
              : opp.winRate < 40
                ? "bg-red-50/60 dark:bg-red-900/15"
                : ""

            return (
              <tr key={opp.name} className={`${rowBg} hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors`}>
                <td className={`${TD} text-left`}>
                  {opp.url ? (
                    <a href={opp.url} target="_blank" rel="noopener noreferrer" className="no-underline text-inherit hover:text-blue-500">
                      {opp.name}
                    </a>
                  ) : (
                    opp.name
                  )}
                </td>
                <td className={TD}>{opp.total}</td>
                <td className={TD}>{opp.wins}</td>
                <td className={TD}>{opp.losses}</td>
                <td className={TD}>
                  <strong className={getStatColor(opp.winRate, "winRate")}>
                    {opp.winRate}%
                  </strong>
                </td>
                <td className={TD}>
                  {opp.avgKd !== null ? (
                    <span className={getStatColor(opp.avgKd, "kd")}>
                      {opp.avgKd}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="cursor-pointer mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showAll ? "Скрыть" : `Показать все (${opponents.length})`}
        </button>
      )}
    </div>
  )
}
