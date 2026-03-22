import type { MapWinRate, MatchRecord } from "../../types"
import { Card } from "./Card"

interface SummaryCardsProps {
  totalMatches: number
  analyzedMatches: number
  avgElo: number
  overallWinRate: Record<string, MapWinRate>
  earliestGame: string
  latestGame: string
  longestWinStreak?: number
  matchRecords?: Record<string, MatchRecord[]>
}

export function SummaryCards({ totalMatches, analyzedMatches, avgElo, overallWinRate, earliestGame, latestGame, longestWinStreak, matchRecords }: SummaryCardsProps) {
  let totalWins = 0
  let totalLosses = 0
  for (const wr of Object.values(overallWinRate)) {
    totalWins += wr.wins
    totalLosses += wr.losses
  }
  const totalGames = totalWins + totalLosses
  const overallRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

  // Вычисляем avg K/D и avg ADR из matchRecords
  let avgKd: number | null = null
  let avgAdr: number | null = null
  if (matchRecords) {
    const allRecords: MatchRecord[] = []
    for (const records of Object.values(matchRecords)) {
      allRecords.push(...records)
    }
    const withKd = allRecords.filter(r => r.kdRatio !== undefined)
    const withAdr = allRecords.filter(r => r.adr !== undefined)
    if (withKd.length > 0) avgKd = +(withKd.reduce((s, r) => s + r.kdRatio!, 0) / withKd.length).toFixed(2)
    if (withAdr.length > 0) avgAdr = +(withAdr.reduce((s, r) => s + r.adr!, 0) / withAdr.length).toFixed(1)
  }

  return (
    <div className="flex gap-2 sm:gap-4 flex-wrap my-4">
      <Card title="Всего матчей" value={totalMatches} subtitle={`Проанализировано: ${analyzedMatches}`} />
      <Card
        title="Общий винрейт"
        value={`${overallRate}%`}
        valueColor={overallRate >= 50 ? "green" : "red"}
        subtitle={`${totalWins}W / ${totalLosses}L`}
      />
      <Card title="Средний ELO" value={avgElo || "\u2014"} />
      {longestWinStreak !== undefined && longestWinStreak > 0 && (
        <Card title="Лучшая серия" value={longestWinStreak} subtitle="побед подряд" />
      )}
      {avgKd !== null && (
        <Card title="Avg K/D" value={avgKd} valueColor={avgKd >= 1 ? "green" : "red"} />
      )}
      {avgAdr !== null && (
        <Card title="Avg ADR" value={avgAdr} />
      )}
      <Card title="Период" value={earliestGame || "\u2014"} subtitle={latestGame || "\u2014"} />
    </div>
  )
}
