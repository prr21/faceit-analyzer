import type { MapWinRate } from "../../types"
import { Card } from "./Card"

interface SummaryCardsProps {
  totalMatches: number
  analyzedMatches: number
  avgElo: number
  overallWinRate: Record<string, MapWinRate>
  earliestGame: string
  latestGame: string
}

export function SummaryCards({ totalMatches, analyzedMatches, avgElo, overallWinRate, earliestGame, latestGame }: SummaryCardsProps) {
  let totalWins = 0
  let totalLosses = 0
  for (const wr of Object.values(overallWinRate)) {
    totalWins += wr.wins
    totalLosses += wr.losses
  }
  const totalGames = totalWins + totalLosses
  const overallRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

  return (
    <div className="flex gap-4 flex-wrap my-4">
      <Card title="Всего матчей" value={totalMatches} subtitle={`Проанализировано: ${analyzedMatches}`} />
      <Card
        title="Общий винрейт"
        value={`${overallRate}%`}
        valueColor={overallRate >= 50 ? "green" : "red"}
        subtitle={`${totalWins}W / ${totalLosses}L`}
      />
      <Card title="Средний ELO" value={avgElo || "\u2014"} />
      <Card title="Период" value={earliestGame || "\u2014"} subtitle={latestGame || "\u2014"} />
    </div>
  )
}
