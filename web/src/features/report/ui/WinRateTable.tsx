import { useState } from "react"
import type { MapWinRate, MatchRecord } from "@/shared/types"
import { MatchList } from "./MatchList"
import { getStatColor, getStatBgColor } from "@/shared/lib/colors"

interface WinRateTableProps {
  winRate: Record<string, MapWinRate>
  matchRecords?: Record<string, MatchRecord[]>
}

interface MapPerformance {
  avgKd: number | null
  avgAdr: number | null
  avgHs: number | null
}

function computeMapPerformance(records: MatchRecord[]): MapPerformance {
  const withKd = records.filter(r => r.kdRatio !== undefined)
  const withAdr = records.filter(r => r.adr !== undefined)
  const withHs = records.filter(r => r.headshotPercent !== undefined)
  return {
    avgKd: withKd.length > 0 ? +(withKd.reduce((s, r) => s + r.kdRatio!, 0) / withKd.length).toFixed(2) : null,
    avgAdr: withAdr.length > 0 ? +(withAdr.reduce((s, r) => s + r.adr!, 0) / withAdr.length).toFixed(1) : null,
    avgHs: withHs.length > 0 ? Math.round(withHs.reduce((s, r) => s + r.headshotPercent!, 0) / withHs.length) : null,
  }
}

const TH = "border border-gray-200 dark:border-gray-700 px-2 sm:px-3.5 py-1 sm:py-1.5 text-center text-sm bg-gray-100 dark:bg-gray-800"
const TD = "border border-gray-200 dark:border-gray-700 px-2 sm:px-3.5 py-1 sm:py-1.5 text-center text-sm"

export function WinRateTable({ winRate, matchRecords }: WinRateTableProps) {
  const [expandedMap, setExpandedMap] = useState<string | null>(null)

  const entries = Object.entries(winRate).sort((a, b) => b[1].rate - a[1].rate)
  if (entries.length === 0) return null

  const hasRecords = matchRecords && Object.keys(matchRecords).length > 0
  const hasAnyStats = hasRecords && Object.values(matchRecords).some(
    recs => recs.some(r => r.kdRatio !== undefined)
  )

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
            {hasAnyStats && (
              <>
                <th className={TH}>K/D</th>
                <th className={TH}>ADR</th>
                <th className={TH}>HS%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map(([map, wr]) => {
            const records = hasRecords ? matchRecords[map] : undefined
            const isExpanded = expandedMap === map
            const perf = hasAnyStats && records ? computeMapPerformance(records) : null

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
                    <div className="flex items-center gap-2 justify-center">
                      <strong className={getStatColor(wr.rate, "winRate")}>{wr.rate}%</strong>
                      <div className="w-16 sm:w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getStatBgColor(wr.rate, "winRate")}`}
                          style={{ width: `${wr.rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  {hasAnyStats && (
                    <>
                      <td className={TD}>
                        {perf?.avgKd != null ? (
                          <span className={`font-medium ${getStatColor(perf.avgKd, "kd")}`}>{perf.avgKd}</span>
                        ) : "—"}
                      </td>
                      <td className={TD}>
                        {perf?.avgAdr != null ? (
                          <span className={getStatColor(perf.avgAdr, "adr")}>{perf.avgAdr}</span>
                        ) : "—"}
                      </td>
                      <td className={TD}>
                        {perf?.avgHs != null ? (
                          <span className={getStatColor(perf.avgHs, "hs")}>{perf.avgHs}%</span>
                        ) : "—"}
                      </td>
                    </>
                  )}
                </tr>
                {records && isExpanded && (
                  <tr>
                    <td colSpan={hasAnyStats ? 8 : 5} className="p-0 border-t-0">
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
