import { useState } from "react"
import type { MapWinRate, MatchRecord } from "../../types"
import { MatchList } from "./MatchList"

interface WinRateTableProps {
  winRate: Record<string, MapWinRate>
  matchRecords?: Record<string, MatchRecord[]>
}

const TH = "border border-gray-200 dark:border-gray-700 px-2 sm:px-3.5 py-1 sm:py-1.5 text-center text-sm bg-gray-100 dark:bg-gray-800"
const TD = "border border-gray-200 dark:border-gray-700 px-2 sm:px-3.5 py-1 sm:py-1.5 text-center text-sm"

export function WinRateTable({ winRate, matchRecords }: WinRateTableProps) {
  const [expandedMap, setExpandedMap] = useState<string | null>(null)

  const entries = Object.entries(winRate).sort((a, b) => b[1].rate - a[1].rate)
  if (entries.length === 0) return null

  const hasRecords = matchRecords && Object.keys(matchRecords).length > 0

  return (
    <div className="overflow-x-auto my-3 mb-8">
      <table className="border-collapse w-full">
        <thead>
          <tr>
            <th className={TH}>Карта</th>
            <th className={TH}>W</th>
            <th className={TH}>L</th>
            <th className={TH}>Всего</th>
            <th className={TH}>Винрейт</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([map, wr]) => {
            const records = hasRecords ? matchRecords[map] : undefined
            const isExpanded = expandedMap === map

            return (
              <tr key={map} className="contents">
                <tr
                  className={records ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" : ""}
                  onClick={() => records && setExpandedMap(isExpanded ? null : map)}
                >
                  <td className={TD}>
                    {records && (
                      <span className="text-xs text-gray-400 mr-1.5">{isExpanded ? "\u25BC" : "\u25B6"}</span>
                    )}
                    {map}
                  </td>
                  <td className={TD}>{wr.wins}</td>
                  <td className={TD}>{wr.losses}</td>
                  <td className={TD}>{wr.total}</td>
                  <td className={TD}>
                    <strong>{wr.rate}%</strong>
                  </td>
                </tr>
                {records && isExpanded && (
                  <tr>
                    <td colSpan={5} className="p-0 border-t-0">
                      <MatchList records={records} />
                    </td>
                  </tr>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
