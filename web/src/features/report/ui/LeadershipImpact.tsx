import { useMemo } from "react"
import type { MatchRecord } from "@/shared/types"
import { getStatColor } from "@/shared/lib/colors"

interface LeadershipImpactProps {
  matchRecords: Record<string, MatchRecord[]>
  leaderMatchRecords: Record<string, MatchRecord[]>
}

interface GroupStats {
  total: number
  wins: number
  winRate: number
  avgKd: number | null
  avgAdr: number | null
}

function computeGroupStats(records: MatchRecord[]): GroupStats {
  const wins = records.filter(r => r.won).length
  const total = records.length
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  const withKd = records.filter(r => r.kdRatio !== undefined)
  const avgKd = withKd.length > 0 ? +(withKd.reduce((s, r) => s + r.kdRatio!, 0) / withKd.length).toFixed(2) : null
  const withAdr = records.filter(r => r.adr !== undefined)
  const avgAdr = withAdr.length > 0 ? +(withAdr.reduce((s, r) => s + r.adr!, 0) / withAdr.length).toFixed(1) : null
  return { total, wins, winRate, avgKd, avgAdr }
}

function DeltaCell({ leader, nonLeader, suffix = "", decimals = 0 }: { leader: number | null; nonLeader: number | null; suffix?: string; decimals?: number }) {
  if (leader === null || nonLeader === null) return <td className={TD}>—</td>
  const delta = leader - nonLeader
  const formatted = (delta >= 0 ? "+" : "") + delta.toFixed(decimals) + suffix
  const color = delta > 0
    ? "text-green-600 dark:text-green-400"
    : delta < 0
      ? "text-red-500 dark:text-red-400"
      : "text-gray-500 dark:text-gray-400"
  return (
    <td className={TD}>
      <span className={color}>{formatted} {delta > 0 ? "▲" : delta < 0 ? "▼" : ""}</span>
    </td>
  )
}

const TH = "px-2 sm:px-3 py-1.5 text-center text-sm font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
const TD = "px-2 sm:px-3 py-1.5 text-center text-sm border border-gray-200 dark:border-gray-700"

export function LeadershipImpact({ matchRecords, leaderMatchRecords }: LeadershipImpactProps) {
  const { leaderStats, nonLeaderStats } = useMemo(() => {
    const allRecords = Object.values(matchRecords).flat()
    const leaderRecords = Object.values(leaderMatchRecords).flat()

    const leaderMatchIds = new Set<string>()
    for (const r of leaderRecords) leaderMatchIds.add(r.matchId)

    const nonLeaderRecords = allRecords.filter(r => !leaderMatchIds.has(r.matchId))

    return {
      leaderStats: computeGroupStats(leaderRecords),
      nonLeaderStats: computeGroupStats(nonLeaderRecords),
    }
  }, [matchRecords, leaderMatchRecords])

  // Не показываем если мало данных в одной из групп
  if (leaderStats.total < 5 || nonLeaderStats.total < 5) return null

  return (
    <div className="overflow-x-auto my-3">
      <table className="border-collapse w-full max-w-lg">
        <thead>
          <tr>
            <th className={TH}>Метрика</th>
            <th className={TH}>Как лидер</th>
            <th className={TH}>Не лидер</th>
            <th className={TH}>Разница</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${TD} font-medium text-left`}>Win%</td>
            <td className={TD}><span className={getStatColor(leaderStats.winRate, "winRate")}>{leaderStats.winRate}%</span></td>
            <td className={TD}><span className={getStatColor(nonLeaderStats.winRate, "winRate")}>{nonLeaderStats.winRate}%</span></td>
            <DeltaCell leader={leaderStats.winRate} nonLeader={nonLeaderStats.winRate} suffix="%" />
          </tr>
          <tr>
            <td className={`${TD} font-medium text-left`}>Карт сыграно</td>
            <td className={TD}>{leaderStats.total}</td>
            <td className={TD}>{nonLeaderStats.total}</td>
            <td className={TD}></td>
          </tr>
          <tr>
            <td className={`${TD} font-medium text-left`}>K/D</td>
            <td className={TD}>{leaderStats.avgKd !== null ? <span className={getStatColor(leaderStats.avgKd, "kd")}>{leaderStats.avgKd}</span> : "—"}</td>
            <td className={TD}>{nonLeaderStats.avgKd !== null ? <span className={getStatColor(nonLeaderStats.avgKd, "kd")}>{nonLeaderStats.avgKd}</span> : "—"}</td>
            <DeltaCell leader={leaderStats.avgKd} nonLeader={nonLeaderStats.avgKd} decimals={2} />
          </tr>
          <tr>
            <td className={`${TD} font-medium text-left`}>ADR</td>
            <td className={TD}>{leaderStats.avgAdr !== null ? <span className={getStatColor(leaderStats.avgAdr, "adr")}>{leaderStats.avgAdr}</span> : "—"}</td>
            <td className={TD}>{nonLeaderStats.avgAdr !== null ? <span className={getStatColor(nonLeaderStats.avgAdr, "adr")}>{nonLeaderStats.avgAdr}</span> : "—"}</td>
            <DeltaCell leader={leaderStats.avgAdr} nonLeader={nonLeaderStats.avgAdr} decimals={1} />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
