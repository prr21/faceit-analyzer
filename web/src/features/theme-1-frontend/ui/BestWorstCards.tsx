import { useMemo } from "react"
import type { MapWinRate, MatchRecord } from "@/types"
import { Card } from "@/components/core/Card"

interface BestWorstCardsProps {
  mapWinRate: Record<string, MapWinRate>
  matchRecords: Record<string, MatchRecord[]>
}

const MIN_GAMES = 3 // Минимальное количество игр для включения в рейтинг

export function BestWorstCards({ mapWinRate, matchRecords }: BestWorstCardsProps) {
  // TODO: Задание 1.3 — Найдите лучшую карту по винрейту
  // Документация: https://react.dev/reference/react/useMemo
  //
  // Используйте useMemo для мемоизации вычислений (пересчёт только при изменении данных):
  //
  // const bestByWinRate = useMemo(() => {
  //   const entries = Object.entries(mapWinRate)
  //     .filter(([_, wr]) => wr.total >= MIN_GAMES)  // Отфильтровать карты с малым количеством игр
  //     .sort((a, b) => b[1].rate - a[1].rate)        // Сортировать по винрейту (убывание)
  //   return entries.length > 0 ? entries[0] : null    // Первый элемент = лучший
  // }, [mapWinRate])
  //
  // Аналог: посмотрите useMemo в MatchHistoryTab.tsx (filtered)
  const bestByWinRate: [string, MapWinRate] | null = null

  // TODO: Задание 1.3 — Найдите худшую карту по винрейту
  // Документация: https://react.dev/reference/react/useMemo
  //
  // Аналогично bestByWinRate, но сортируйте по возрастанию (a[1].rate - b[1].rate)
  // и берите первый элемент
  const worstByWinRate: [string, MapWinRate] | null = null

  // TODO: Задание 1.3 — Найдите лучшую карту по среднему K/D
  // Документация: https://react.dev/reference/react/useMemo
  //
  // Для каждой карты из matchRecords нужно вычислить средний K/D:
  // const bestByKd = useMemo(() => {
  //   const mapKds = Object.entries(matchRecords)
  //     .map(([map, records]) => {
  //       const withKd = records.filter(r => r.kdRatio !== undefined)
  //       if (withKd.length < MIN_GAMES) return null
  //       const avgKd = withKd.reduce((sum, r) => sum + r.kdRatio!, 0) / withKd.length
  //       return { map, avgKd: +avgKd.toFixed(2) }
  //     })
  //     .filter(Boolean)
  //     .sort((a, b) => b!.avgKd - a!.avgKd)
  //   return mapKds.length > 0 ? mapKds[0] : null
  // }, [matchRecords])
  //
  // Аналог: computeMapPerformance в WinRateTable.tsx
  const bestByKd: { map: string; avgKd: number } | null = null

  // TODO: Задание 1.3 — Найдите лучшую карту по среднему ADR
  // Документация: https://react.dev/reference/react/useMemo
  //
  // Аналогично bestByKd, но вычисляйте средний ADR:
  // const withAdr = records.filter(r => r.adr !== undefined)
  // const avgAdr = withAdr.reduce((sum, r) => sum + r.adr!, 0) / withAdr.length
  const bestByAdr: { map: string; avgAdr: number } | null = null

  // Если нет данных — не рендерим секцию
  if (!bestByWinRate && !worstByWinRate && !bestByKd && !bestByAdr) {
    return null
  }

  return (
    <div className="my-4">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
        Лучшие и худшие результаты
      </h3>
      <div className="flex gap-2 sm:gap-4 flex-wrap">
        {/* TODO: Задание 1.3 — Отобразите результаты в карточках
         * Документация: https://react.dev/reference/react/useMemo
         *
         * Используйте компонент Card (уже импортирован) для каждого результата.
         * Пример (раскомментируйте и адаптируйте):
         *
         * {bestByWinRate && (
         *   <Card
         *     title="Лучшая карта (WR)"
         *     value={`${bestByWinRate[1].rate}%`}
         *     valueColor="green"
         *     subtitle={bestByWinRate[0]}
         *   />
         * )}
         *
         * {worstByWinRate && (
         *   <Card
         *     title="Худшая карта (WR)"
         *     value={`${worstByWinRate[1].rate}%`}
         *     valueColor="red"
         *     subtitle={worstByWinRate[0]}
         *   />
         * )}
         *
         * {bestByKd && (
         *   <Card
         *     title="Лучшая K/D"
         *     value={bestByKd.avgKd}
         *     valueColor="green"
         *     subtitle={bestByKd.map}
         *   />
         * )}
         *
         * {bestByAdr && (
         *   <Card
         *     title="Лучшая ADR"
         *     value={bestByAdr.avgAdr}
         *     valueColor="green"
         *     subtitle={bestByAdr.map}
         *   />
         * )}
         *
         * Аналог: посмотрите как Card используется в SummaryCards.tsx
         */}
      </div>
    </div>
  )
}
