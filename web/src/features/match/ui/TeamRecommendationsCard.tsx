import type { MapRecommendation, TeamRecommendations } from "@/shared/types"

const TOP_COUNT = 3

function formatMap(map: string): string {
  return map.replace("de_", "")
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  // score ~[-1, 1] → ширина полосы 0..100%
  const width = Math.min(100, Math.abs(score) * 100)
  return (
    <div className="w-16 sm:w-20 h-1.5 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
      <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  )
}

function RecommendationRow({
  rec,
  color,
}: {
  rec: MapRecommendation
  color: string
}) {
  return (
    <li className="py-2">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm w-20 shrink-0 capitalize">{formatMap(rec.map)}</span>
        <ScoreBar score={rec.score} color={color} />
        <span className="text-xs text-gray-400 tabular-nums">{rec.score.toFixed(2)}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rec.reason}</p>
      <details className="mt-1">
        <summary className="text-[11px] text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
          Разбивка факторов
        </summary>
        <ul className="mt-1 space-y-0.5">
          {rec.factors.map(f => (
            <li key={f.key} className="text-[11px] text-gray-500 dark:text-gray-400 flex justify-between gap-2">
              <span>
                {f.label}
                {f.detail ? ` — ${f.detail}` : ""}
              </span>
              <span className={`tabular-nums ${f.contribution >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                {f.contribution >= 0 ? "+" : ""}{f.contribution.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </li>
  )
}

export function TeamRecommendationsCard({ recs }: { recs: TeamRecommendations }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-bold text-sm truncate">{recs.teamName}</h3>
        {recs.lowData && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
            мало данных
          </span>
        )}
      </div>

      <div className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mt-3">
        Что пикать
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {recs.picks.slice(0, TOP_COUNT).map(rec => (
          <RecommendationRow key={rec.map} rec={rec} color="bg-green-500" />
        ))}
      </ul>

      <div className="text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-400 mt-3">
        Что банить
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {recs.bans.slice(0, TOP_COUNT).map(rec => (
          <RecommendationRow key={rec.map} rec={rec} color="bg-red-500" />
        ))}
      </ul>
    </div>
  )
}
