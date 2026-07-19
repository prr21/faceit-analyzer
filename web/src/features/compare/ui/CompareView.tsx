import type { ReportData, PlayerDropPickStats, MapWinRate, MatchRecord } from "@/shared/types"

interface CompareViewProps {
  player1: ReportData
  player2: ReportData
}

interface PlayerMetrics {
  name: string
  avatar?: string
  elo: number
  winRate: number
  avgKd: number
  avgAdr: number
  bestMap: string
}

function isPlayerStats(stats: unknown): stats is PlayerDropPickStats {
  return typeof stats === "object" && stats !== null && "leaderMapWinRate" in stats
}

function computeMetrics(data: ReportData): PlayerMetrics {
  const stats = data.stats
  const playerStats = isPlayerStats(stats) ? stats : null
  const profile = playerStats?.playerProfile

  const wrEntries = Object.values(stats.mapWinRate)
  const totalWins = wrEntries.reduce((s, wr) => s + wr.wins, 0)
  const totalGames = wrEntries.reduce((s, wr) => s + wr.total, 0)
  const winRate = totalGames > 0 ? +((totalWins / totalGames) * 100).toFixed(1) : 0

  const allRecords: MatchRecord[] = Object.values(stats.matchRecords).flat()
  const withKd = allRecords.filter(r => r.kdRatio !== undefined)
  const avgKd = withKd.length > 0
    ? +(withKd.reduce((s, r) => s + r.kdRatio!, 0) / withKd.length).toFixed(2)
    : 0
  const withAdr = allRecords.filter(r => r.adr !== undefined)
  const avgAdr = withAdr.length > 0
    ? +(withAdr.reduce((s, r) => s + r.adr!, 0) / withAdr.length).toFixed(1)
    : 0

  const mapEntries = Object.entries(stats.mapWinRate)
    .filter(([, wr]: [string, MapWinRate]) => wr.total >= 3)
    .sort((a, b) => b[1].rate - a[1].rate)
  const bestMap = mapEntries.length > 0 ? mapEntries[0][0].replace("de_", "") : "—"

  return {
    name: profile?.nickname ?? data.name,
    avatar: profile?.avatar,
    elo: profile?.currentElo ?? 0,
    winRate,
    avgKd,
    avgAdr,
    bestMap,
  }
}

function metricClass(a: number, b: number, isForA: boolean): string {
  if (a === b) return "text-gray-500 dark:text-gray-400"
  const better = isForA ? a > b : b > a
  return better ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-500 dark:text-red-400"
}

interface MetricRowProps {
  label: string
  displayA: string
  displayB: string
  a: number
  b: number
}

function MetricRow({ label, displayA, displayB, a, b }: MetricRowProps) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className={`text-right tabular-nums ${metricClass(a, b, true)}`}>{displayA}</span>
      <span className="text-center text-xs text-gray-400 uppercase">{label}</span>
      <span className={`text-left tabular-nums ${metricClass(a, b, false)}`}>{displayB}</span>
    </div>
  )
}

export function CompareView({ player1, player2 }: CompareViewProps) {
  const m1 = computeMetrics(player1)
  const m2 = computeMetrics(player2)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 my-4">
      <div className="grid grid-cols-3 items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-right">
          {m1.avatar && (
            <img
              src={m1.avatar}
              alt={m1.name}
              className="w-10 h-10 rounded-full inline-block"
              onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          )}
          <div className="font-bold">{m1.name}</div>
        </div>
        <div className="text-center text-gray-400 font-semibold">VS</div>
        <div className="text-left">
          {m2.avatar && (
            <img
              src={m2.avatar}
              alt={m2.name}
              className="w-10 h-10 rounded-full inline-block"
              onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
            />
          )}
          <div className="font-bold">{m2.name}</div>
        </div>
      </div>

      <div className="space-y-1">
        <MetricRow label="ELO" displayA={String(m1.elo)} displayB={String(m2.elo)} a={m1.elo} b={m2.elo} />
        <MetricRow label="Win Rate" displayA={`${m1.winRate}%`} displayB={`${m2.winRate}%`} a={m1.winRate} b={m2.winRate} />
        <MetricRow label="K/D" displayA={String(m1.avgKd)} displayB={String(m2.avgKd)} a={m1.avgKd} b={m2.avgKd} />
        <MetricRow label="ADR" displayA={String(m1.avgAdr)} displayB={String(m2.avgAdr)} a={m1.avgAdr} b={m2.avgAdr} />
        <div className="grid grid-cols-3 items-center gap-2 py-1">
          <span className="text-right text-gray-600 dark:text-gray-300">{m1.bestMap}</span>
          <span className="text-center text-xs text-gray-400 uppercase">Лучшая карта</span>
          <span className="text-left text-gray-600 dark:text-gray-300">{m2.bestMap}</span>
        </div>
      </div>
    </div>
  )
}
