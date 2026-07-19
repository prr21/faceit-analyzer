import type { MatchRecord, EloSnapshot } from "@/shared/types"
import { WinLossStreak } from "./WinLossStreak"
import { getStatColor } from "@/shared/lib/colors"

interface RecentPerformanceProps {
  matchRecords: Record<string, MatchRecord[]>
  eloHistory: EloSnapshot[]
  count?: number
}

export function RecentPerformance({ matchRecords, eloHistory, count = 20 }: RecentPerformanceProps) {
  // Собираем все матчи, сортируем по дате, берём последние N
  const allRecords: MatchRecord[] = []
  for (const records of Object.values(matchRecords)) {
    allRecords.push(...records)
  }
  // Дедупликация по matchId (в BO3 один матч может быть на нескольких картах)
  const seen = new Set<string>()
  const unique = allRecords.filter(r => {
    if (seen.has(r.matchId)) return false
    seen.add(r.matchId)
    return true
  })
  unique.sort((a, b) => b.date - a.date)
  const recent = unique.slice(0, count)

  if (recent.length === 0) return null

  const hasStats = recent.some(r => r.kills !== undefined)

  // Агрегируем статистику
  const wins = recent.filter(r => r.won).length
  const winRate = Math.round((wins / recent.length) * 100)

  let avgKd: number | null = null
  let avgAdr: number | null = null
  let avgHs: number | null = null

  if (hasStats) {
    const withKd = recent.filter(r => r.kdRatio !== undefined)
    const withAdr = recent.filter(r => r.adr !== undefined)
    const withHs = recent.filter(r => r.headshotPercent !== undefined)
    if (withKd.length > 0) avgKd = +(withKd.reduce((s, r) => s + r.kdRatio!, 0) / withKd.length).toFixed(2)
    if (withAdr.length > 0) avgAdr = +(withAdr.reduce((s, r) => s + r.adr!, 0) / withAdr.length).toFixed(1)
    if (withHs.length > 0) avgHs = Math.round(withHs.reduce((s, r) => s + r.headshotPercent!, 0) / withHs.length)
  }

  // ELO change за последние N матчей
  const recentElo = eloHistory.slice(-count)
  const eloChange = recentElo.length >= 2 ? recentElo[recentElo.length - 1].elo - recentElo[0].elo : 0

  return (
    <div className="my-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
        Недавние результаты <span className="font-normal text-gray-400">(последние {recent.length} матчей)</span>
      </h3>

      {/* Метрики */}
      <div className="flex flex-wrap gap-4 sm:gap-6 mb-3">
        <Metric label="Win%" value={`${winRate}%`} colorClass={getStatColor(winRate, "winRate")} />
        {avgKd !== null && <Metric label="K/D" value={avgKd.toString()} colorClass={getStatColor(avgKd, "kd")} />}
        {avgAdr !== null && <Metric label="ADR" value={avgAdr.toString()} colorClass={getStatColor(avgAdr, "adr")} />}
        {avgHs !== null && <Metric label="HS%" value={`${avgHs}%`} colorClass={getStatColor(avgHs, "hs")} />}
        <Metric label="ELO" value={`${eloChange >= 0 ? "+" : ""}${eloChange}`} colorClass={eloChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"} />
      </div>

      {/* W/L streak визуализация */}
      <WinLossStreak eloHistory={eloHistory} count={count} />
    </div>
  )
}

function Metric({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div>
      <div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase">{label}</div>
      <div className={`text-lg font-bold ${colorClass ?? "text-gray-800 dark:text-gray-200"}`}>{value}</div>
    </div>
  )
}
