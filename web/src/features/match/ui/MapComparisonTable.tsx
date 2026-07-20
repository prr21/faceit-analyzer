import { getStatColor } from "@/shared/lib/colors"
import type { MapWinRate, MatchTeamAnalysis } from "@/shared/types"

function formatMap(map: string): string {
  return map.replace("de_", "")
}

function WinRateCell({ wr }: { wr: MapWinRate | undefined }) {
  if (!wr || wr.total === 0) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>
  }
  return (
    <span className={getStatColor(wr.rate, "winRate")}>
      {Math.round(wr.rate)}%
      <span className="text-gray-400 dark:text-gray-500 font-normal"> ({wr.total})</span>
    </span>
  )
}

function HabitsCell({ team, map }: { team: MatchTeamAnalysis; map: string }) {
  const pick = team.mapHabits[map]?.pickRate ?? 0
  const ban = team.mapHabits[map]?.banRate ?? 0
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
      <span className="text-green-600 dark:text-green-400">пик {Math.round(pick * 100)}%</span>
      {" · "}
      <span className="text-red-500 dark:text-red-400">бан {Math.round(ban * 100)}%</span>
    </span>
  )
}

export function MapComparisonTable({
  teams,
  maps,
}: {
  teams: [MatchTeamAnalysis, MatchTeamAnalysis]
  maps: string[]
}) {
  const [a, b] = teams
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 text-left font-medium" colSpan={2}>{a.name}</th>
              <th className="px-3 py-2 text-center font-medium">Карта</th>
              <th className="px-3 py-2 text-right font-medium" colSpan={2}>{b.name}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {maps.map(map => (
              <tr key={map} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-3 py-2 font-semibold tabular-nums">
                  <WinRateCell wr={a.stats.mapWinRate[map]} />
                </td>
                <td className="px-3 py-2">
                  <HabitsCell team={a} map={map} />
                </td>
                <td className="px-3 py-2 text-center font-medium capitalize">{formatMap(map)}</td>
                <td className="px-3 py-2 text-right">
                  <HabitsCell team={b} map={map} />
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  <WinRateCell wr={b.stats.mapWinRate[map]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700">
        Винрейт командных матчей и привычки вето каждой команды. В скобках — количество матчей на карте.
      </p>
    </div>
  )
}
