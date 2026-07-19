import type { EloSnapshot } from "@/shared/types"

interface WinLossStreakProps {
  eloHistory: EloSnapshot[]
  count?: number
}

export function WinLossStreak({ eloHistory, count = 30 }: WinLossStreakProps) {
  // Берём последние N матчей (eloHistory отсортирован хронологически)
  const recent = eloHistory.slice(-count)
  if (recent.length === 0) return null

  const wins = recent.filter(e => e.result === "win").length
  const losses = recent.length - wins

  return (
    <div>
      <div className="flex gap-[2px] my-2">
        {recent.map((e, i) => (
          <div
            key={i}
            className={`h-3 flex-1 min-w-[4px] max-w-[12px] rounded-sm ${
              e.result === "win" ? "bg-green-500" : "bg-red-500"
            }`}
            title={`${new Date(e.date * 1000).toLocaleDateString("ru-RU")} — ${e.result === "win" ? "Победа" : "Поражение"}`}
          />
        ))}
      </div>
      <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span>W <span className="font-semibold text-green-600">{wins}</span></span>
        <span>L <span className="font-semibold text-red-500">{losses}</span></span>
        <span>({Math.round((wins / recent.length) * 100)}%)</span>
      </div>
    </div>
  )
}
