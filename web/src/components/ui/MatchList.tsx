import type { MatchRecord } from "../../types"

function formatMatchDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("ru-RU")
}

interface MatchListProps {
  records: MatchRecord[]
}

export function MatchList({ records }: MatchListProps) {
  if (!records || records.length === 0) return null

  const hasStats = records.some(r => r.kills !== undefined)

  return (
    <div className="max-h-[300px] overflow-y-auto py-1 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-[11px] text-gray-400 dark:text-gray-500 uppercase">
            <th className="text-left font-medium px-2 py-1 w-[80px]">Дата</th>
            <th className="text-left font-medium px-2 py-1">Счёт</th>
            <th className="text-left font-medium px-2 py-1">Противник</th>
            <th className="text-left font-medium px-2 py-1">Турнир</th>
            {hasStats && (
              <>
                <th className="text-center font-medium px-2 py-1 w-[70px]">K/D/A</th>
                <th className="text-center font-medium px-2 py-1 w-[45px]">ADR</th>
                <th className="text-center font-medium px-2 py-1 w-[40px]">HS%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            // Турнир + avg elo
            const compLabel = r.competitionName
              ? (r.targetRating ? `${r.competitionName} (${r.targetRating})` : r.competitionName)
              : (r.targetRating ? `(${r.targetRating})` : "—")

            return (
              <tr
                key={r.matchId}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  r.won ? "border-l-[3px] border-l-green-600" : "border-l-[3px] border-l-red-600"
                }`}
              >
                <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400 text-[13px] whitespace-nowrap">
                  <a href={r.faceitUrl} target="_blank" rel="noopener noreferrer" className="no-underline text-inherit hover:text-blue-500">
                    {formatMatchDate(r.date)}
                  </a>
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
                    <td className="px-2 py-1.5 text-center tabular-nums text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {r.kills !== undefined ? `${r.kills}/${r.deaths}/${r.assists}` : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-center tabular-nums text-gray-600 dark:text-gray-300">
                      {r.adr !== undefined ? r.adr : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-center tabular-nums text-gray-600 dark:text-gray-300">
                      {r.headshotPercent !== undefined ? `${r.headshotPercent}%` : "—"}
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
