import React, { useState, useMemo } from "react"
import type { TeamDropPickStats, PlayerDropPickStats, MatchRecord } from "../../../types"
import { getStatColor } from "../../../utils/colors"
import { MatchDetailCard } from "../ui/MatchDetailCard"

type FlatMatchRecord = MatchRecord & { mapName: string }

interface MatchHistoryTabProps {
  stats: TeamDropPickStats | PlayerDropPickStats
  mode?: "leader" | "all"
  isDark: boolean
}

function isPlayerStats(stats: TeamDropPickStats | PlayerDropPickStats): stats is PlayerDropPickStats {
  return "leaderMapWinRate" in stats
}

function flattenMatchRecords(records: Record<string, MatchRecord[]>): FlatMatchRecord[] {
  const flat: FlatMatchRecord[] = []
  for (const [mapName, mapRecords] of Object.entries(records)) {
    for (const r of mapRecords) {
      flat.push({ ...r, mapName })
    }
  }
  flat.sort((a, b) => b.date - a.date)
  return flat
}

function formatMatchDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("ru-RU")
}

const PAGE_SIZE = 20

const btnBase = "cursor-pointer px-3 py-1 text-sm rounded-md border transition-colors"
const btnActive = "bg-blue-500 text-white border-blue-500"
const btnInactive = "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"

export function MatchHistoryTab({ stats, mode }: MatchHistoryTabProps) {
  const [page, setPage] = useState(0)
  const [mapFilter, setMapFilter] = useState<string | null>(null)
  const [resultFilter, setResultFilter] = useState<"all" | "win" | "loss">("all")

  // TODO: Задание 1.2 — Состояние раскрытия строки
  // Документация: https://react.dev/reference/react/useState
  // Раскомментируйте и используйте для управления раскрытой строкой:
  // const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null)
  //
  // Подсказка: аналог — expandedMap в WinRateTable.tsx
  // При клике на строку: setExpandedMatchId(id === expandedMatchId ? null : id)

  const useLeaderData = mode === "leader" && isPlayerStats(stats)
  const matchRecords = useLeaderData && isPlayerStats(stats) ? stats.leaderMatchRecords : stats.matchRecords

  const allRecords = useMemo(() => flattenMatchRecords(matchRecords), [matchRecords])

  const maps = useMemo(() => {
    const set = new Set(allRecords.map(r => r.mapName))
    return [...set].sort()
  }, [allRecords])

  const filtered = useMemo(() => {
    let result = allRecords
    if (mapFilter) result = result.filter(r => r.mapName === mapFilter)
    if (resultFilter === "win") result = result.filter(r => r.won)
    if (resultFilter === "loss") result = result.filter(r => !r.won)
    return result
  }, [allRecords, mapFilter, resultFilter])

  // Сброс страницы при изменении фильтров
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageRecords = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const hasStats = allRecords.some(r => r.kills !== undefined)

  if (allRecords.length === 0) {
    return <p className="py-5 text-gray-500 dark:text-gray-400">Нет данных о матчах</p>
  }

  return (
    <div className="py-5">
      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={mapFilter || ""}
          onChange={e => { setMapFilter(e.target.value || null); setPage(0) }}
          className="cursor-pointer px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
        >
          <option value="">Все карты</option>
          {maps.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <div className="flex gap-0.5">
          {(["all", "win", "loss"] as const).map(f => (
            <button
              key={f}
              onClick={() => { setResultFilter(f); setPage(0) }}
              className={`${btnBase} ${resultFilter === f ? btnActive : btnInactive}`}
            >
              {f === "all" ? "Все" : f === "win" ? "Победы" : "Поражения"}
            </button>
          ))}
        </div>

        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          {filtered.length} из {allRecords.length}
        </span>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[11px] text-gray-400 dark:text-gray-500 uppercase">
              <th className="text-left font-medium px-2 py-1 w-[80px]">Дата</th>
              <th className="text-left font-medium px-2 py-1">Карта</th>
              <th className="text-left font-medium px-2 py-1">Счёт</th>
              <th className="text-left font-medium px-2 py-1">Противник</th>
              <th className="text-left font-medium px-2 py-1">Турнир</th>
              {hasStats && (
                <>
                  <th className="text-right font-medium px-2 py-1 w-[70px]">K/D/A</th>
                  <th className="text-right font-medium px-2 py-1 w-[45px]">ADR</th>
                  <th className="text-right font-medium px-2 py-1 w-[40px]">HS%</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {pageRecords.map((r, i) => {
              const compLabel = r.competitionName
                ? (r.targetRating ? `${r.competitionName} (${r.targetRating})` : r.competitionName)
                : (r.targetRating ? `(${r.targetRating})` : "—")

              return (
                <React.Fragment key={`${r.matchId}-${r.mapName}-${i}`}>
                <tr
                  // TODO: Задание 1.2 — Сделайте строку кликабельной
                  // Документация: https://react.dev/reference/react/useState
                  // Добавьте onClick и className="cursor-pointer" к этому <tr>:
                  //
                  // onClick={() => setExpandedMatchId(
                  //   r.matchId === expandedMatchId ? null : r.matchId
                  // )}
                  // className={`cursor-pointer hover:bg-gray-50 ...existing classes...`}
                  //
                  // Подсказка: посмотрите как это сделано в WinRateTable.tsx (onClick на <tr>)
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    r.won ? "border-l-[3px] border-l-green-600" : "border-l-[3px] border-l-red-600"
                  }`}
                >
                  <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400 text-[13px] whitespace-nowrap">
                    <a href={r.faceitUrl} target="_blank" rel="noopener noreferrer" className="no-underline text-inherit hover:text-blue-500">
                      {formatMatchDate(r.date)}
                    </a>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-[13px]">
                    {r.mapName.replace("de_", "")}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap tabular-nums">
                    <span className="font-semibold">{r.mapScore}</span>
                    {r.matchScore && <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1.5">BO{r.bestOf} ({r.matchScore})</span>}
                  </td>
                  <td className="px-2 py-1.5 truncate max-w-[180px]">
                    vs {r.opponentTeamUrl ? (
                      <a href={r.opponentTeamUrl} target="_blank" rel="noopener noreferrer" className="no-underline text-inherit hover:text-blue-500">
                        {r.opponentName}
                      </a>
                    ) : (
                      r.opponentName
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-[12px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]" title={compLabel}>
                    {r.competitionUrl ? (
                      <a href={r.competitionUrl} target="_blank" rel="noopener noreferrer" className="no-underline text-inherit hover:text-blue-500">
                        {compLabel}
                      </a>
                    ) : (
                      compLabel
                    )}
                  </td>
                  {hasStats && (
                    <>
                      <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${r.kdRatio !== undefined ? getStatColor(r.kdRatio, "kd") : "text-gray-500"}`}>
                        {r.kills !== undefined ? `${r.kills}/${r.deaths}/${r.assists}` : "—"}
                      </td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${r.adr !== undefined ? getStatColor(r.adr, "adr") : "text-gray-500"}`}>
                        {r.adr !== undefined ? r.adr : "—"}
                      </td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${r.headshotPercent !== undefined ? getStatColor(r.headshotPercent, "hs") : "text-gray-500"}`}>
                        {r.headshotPercent !== undefined ? `${r.headshotPercent}%` : "—"}
                      </td>
                    </>
                  )}
                </tr>
                {/* TODO: Задание 1.2 — Раскрываемая карточка
                 * Документация: https://react.dev/reference/react/useState
                 * Раскомментируйте для отображения карточки под раскрытой строкой:
                 *
                 * {expandedMatchId === r.matchId && (
                 *   <tr>
                 *     <td colSpan={hasStats ? 8 : 5} className="p-0">
                 *       <MatchDetailCard record={r} mapName={r.mapName} />
                 *     </td>
                 *   </tr>
                 * )}
                 */}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className={`${btnBase} ${safePage === 0 ? "opacity-40 cursor-not-allowed" : btnInactive}`}
          >
            ← Назад
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className={`${btnBase} ${safePage >= totalPages - 1 ? "opacity-40 cursor-not-allowed" : btnInactive}`}
          >
            Далее →
          </button>
        </div>
      )}
    </div>
  )
}
