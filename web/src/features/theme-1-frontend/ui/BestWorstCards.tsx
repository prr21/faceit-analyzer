import { useMemo } from "react"
import type { MapWinRate, MatchRecord } from "@/types"
import { Card } from "@/components/core/Card"

interface BestWorstCardsProps {
  mapWinRate: Record<string, MapWinRate>
  matchRecords: Record<string, MatchRecord[]>
}

const MIN_GAMES = 3

export function BestWorstCards({ mapWinRate, matchRecords }: BestWorstCardsProps) {
  const bestByWinRate = useMemo<[string, MapWinRate] | null>(() => {
    const entries = Object.entries(mapWinRate)
      .filter(([, wr]) => wr.total >= MIN_GAMES)
      .sort((a, b) => b[1].rate - a[1].rate)
    return entries.length > 0 ? entries[0] : null
  }, [mapWinRate])

  const worstByWinRate = useMemo<[string, MapWinRate] | null>(() => {
    const entries = Object.entries(mapWinRate)
      .filter(([, wr]) => wr.total >= MIN_GAMES)
      .sort((a, b) => a[1].rate - b[1].rate)
    return entries.length > 0 ? entries[0] : null
  }, [mapWinRate])

  const bestByKd = useMemo<{ map: string; avgKd: number } | null>(() => {
    const mapKds = Object.entries(matchRecords)
      .map(([map, records]) => {
        const withKd = records.filter(r => r.kdRatio !== undefined)
        if (withKd.length < MIN_GAMES) return null
        const avgKd = withKd.reduce((sum, r) => sum + r.kdRatio!, 0) / withKd.length
        return { map, avgKd: +avgKd.toFixed(2) }
      })
      .filter((x): x is { map: string; avgKd: number } => x !== null)
      .sort((a, b) => b.avgKd - a.avgKd)
    return mapKds.length > 0 ? mapKds[0] : null
  }, [matchRecords])

  const bestByAdr = useMemo<{ map: string; avgAdr: number } | null>(() => {
    const mapAdrs = Object.entries(matchRecords)
      .map(([map, records]) => {
        const withAdr = records.filter(r => r.adr !== undefined)
        if (withAdr.length < MIN_GAMES) return null
        const avgAdr = withAdr.reduce((sum, r) => sum + r.adr!, 0) / withAdr.length
        return { map, avgAdr: +avgAdr.toFixed(1) }
      })
      .filter((x): x is { map: string; avgAdr: number } => x !== null)
      .sort((a, b) => b.avgAdr - a.avgAdr)
    return mapAdrs.length > 0 ? mapAdrs[0] : null
  }, [matchRecords])

  if (!bestByWinRate && !worstByWinRate && !bestByKd && !bestByAdr) {
    return null
  }

  return (
    <div className="my-4">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
        Лучшие и худшие результаты
      </h3>
      <div className="flex gap-2 sm:gap-4 flex-wrap">
        {bestByWinRate && (
          <Card
            title="Лучшая карта (WR)"
            value={`${bestByWinRate[1].rate}%`}
            valueColor="green"
            subtitle={bestByWinRate[0].replace("de_", "")}
          />
        )}
        {worstByWinRate && (
          <Card
            title="Худшая карта (WR)"
            value={`${worstByWinRate[1].rate}%`}
            valueColor="red"
            subtitle={worstByWinRate[0].replace("de_", "")}
          />
        )}
        {bestByKd && (
          <Card
            title="Лучшая K/D"
            value={bestByKd.avgKd}
            valueColor="green"
            subtitle={bestByKd.map.replace("de_", "")}
          />
        )}
        {bestByAdr && (
          <Card
            title="Лучшая ADR"
            value={bestByAdr.avgAdr}
            valueColor="green"
            subtitle={bestByAdr.map.replace("de_", "")}
          />
        )}
      </div>
    </div>
  )
}
