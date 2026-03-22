import { useState } from "react"
import type { MapWinRate, MatchRecord } from "../../types"
import { MatchList } from "./MatchList"

interface WinRateTableProps {
  winRate: Record<string, MapWinRate>
  matchRecords?: Record<string, MatchRecord[]>
}

export function WinRateTable({ winRate, matchRecords }: WinRateTableProps) {
  const [expandedMap, setExpandedMap] = useState<string | null>(null)

  const entries = Object.entries(winRate).sort((a, b) => b[1].rate - a[1].rate)
  if (entries.length === 0) return null

  const hasRecords = matchRecords && Object.keys(matchRecords).length > 0

  return (
    <table className="border-collapse my-3 mb-8 w-full">
      <thead>
        <tr>
          <th className="border border-gray-200 px-3.5 py-1.5 text-center bg-gray-100">Карта</th>
          <th className="border border-gray-200 px-3.5 py-1.5 text-center bg-gray-100">W</th>
          <th className="border border-gray-200 px-3.5 py-1.5 text-center bg-gray-100">L</th>
          <th className="border border-gray-200 px-3.5 py-1.5 text-center bg-gray-100">Всего</th>
          <th className="border border-gray-200 px-3.5 py-1.5 text-center bg-gray-100">Винрейт</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([map, wr]) => {
          const records = hasRecords ? matchRecords[map] : undefined
          const isExpanded = expandedMap === map

          return (
            <tr key={map} className="contents">
              <tr
                className={records ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
                onClick={() => records && setExpandedMap(isExpanded ? null : map)}
              >
                <td className="border border-gray-200 px-3.5 py-1.5 text-center">
                  {records && (
                    <span className="text-xs text-gray-400 mr-1.5">{isExpanded ? "\u25BC" : "\u25B6"}</span>
                  )}
                  {map}
                </td>
                <td className="border border-gray-200 px-3.5 py-1.5 text-center">{wr.wins}</td>
                <td className="border border-gray-200 px-3.5 py-1.5 text-center">{wr.losses}</td>
                <td className="border border-gray-200 px-3.5 py-1.5 text-center">{wr.total}</td>
                <td className="border border-gray-200 px-3.5 py-1.5 text-center">
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
  )
}
