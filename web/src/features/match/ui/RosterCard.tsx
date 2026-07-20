import { Link } from "react-router-dom"
import { playerPath } from "@/shared/routing/paths"
import { getStatColor } from "@/shared/lib/colors"
import type { MatchRosterPlayer, MatchTeamAnalysis } from "@/shared/types"

function formatMap(map: string): string {
  return map.replace("de_", "")
}

function PlayerMapStatsPanel({ player }: { player: MatchRosterPlayer }) {
  if (player.mapStats.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500 px-1 py-2">Нет статистики по картам</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs mt-1">
        <thead>
          <tr className="text-gray-400 dark:text-gray-500">
            <th className="px-2 py-1 text-left font-medium">Карта</th>
            <th className="px-2 py-1 text-right font-medium">Матчи</th>
            <th className="px-2 py-1 text-right font-medium">WR</th>
            <th className="px-2 py-1 text-right font-medium">K/D</th>
            <th className="px-2 py-1 text-right font-medium">ADR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {player.mapStats.map(ms => (
            <tr key={ms.map}>
              <td className="px-2 py-1 capitalize">{formatMap(ms.map)}</td>
              <td className="px-2 py-1 text-right tabular-nums">{ms.matches}</td>
              <td className={`px-2 py-1 text-right tabular-nums font-medium ${getStatColor(ms.winRate, "winRate")}`}>
                {Math.round(ms.winRate)}%
              </td>
              <td className={`px-2 py-1 text-right tabular-nums ${getStatColor(ms.avgKd, "kd")}`}>
                {ms.avgKd.toFixed(2)}
              </td>
              <td className="px-2 py-1 text-right tabular-nums">
                {ms.adr ? Math.round(ms.adr) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RosterCard({ team }: { team: MatchTeamAnalysis }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="font-bold text-sm mb-2 truncate">{team.name}</h3>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {team.roster.map(player => (
          <li key={player.playerId} className="py-1.5">
            <details>
              <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-gray-400 dark:text-gray-500 text-xs">▸</span>
                <Link
                  to={playerPath(player.nickname)}
                  onClick={e => e.stopPropagation()}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {player.nickname}
                </Link>
                {player.playerId === team.leader && (
                  <span className="text-[10px] px-1.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    капитан
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                  {player.skillLevel > 0 ? `lvl ${player.skillLevel}` : ""}
                </span>
              </summary>
              <PlayerMapStatsPanel player={player} />
            </details>
          </li>
        ))}
      </ul>
    </div>
  )
}
