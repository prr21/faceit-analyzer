import type { MatchRecord } from "../../types"

function formatMatchDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("ru-RU")
}

interface MatchListProps {
  records: MatchRecord[]
}

export function MatchList({ records }: MatchListProps) {
  if (!records || records.length === 0) return null

  return (
    <div className="max-h-[300px] overflow-y-auto py-1">
      {records.map((r) => {
        const meta: string[] = []
        if (r.matchScore) meta.push(`BO${r.bestOf} (${r.matchScore})`)
        if (r.competitionName) meta.push(r.competitionName)
        const opponentElo = r.opponentRating ? ` (${r.opponentRating})` : ""

        return (
          <a
            key={r.matchId}
            href={r.faceitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-wrap sm:flex-nowrap gap-x-3 gap-y-0.5 items-center px-3 py-1.5 rounded no-underline text-gray-800 dark:text-gray-200 my-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              r.won ? "border-l-[3px] border-l-green-600" : "border-l-[3px] border-l-red-600"
            }`}
          >
            <span className="min-w-[80px] text-gray-500 dark:text-gray-400 text-[13px] order-3 sm:order-none">{formatMatchDate(r.date)}</span>
            <span className="font-semibold min-w-[50px] text-center">{r.mapScore}</span>
            <span className="flex-1 min-w-0 truncate">vs {r.opponentName}{opponentElo}</span>
            {meta.length > 0 && <span className="text-xs text-gray-400 dark:text-gray-500 order-4 sm:order-none">{meta.join(" \u00B7 ")}</span>}
          </a>
        )
      })}
    </div>
  )
}
