import ReactECharts from "echarts-for-react"
import type { MapWinRate, MatchRecord } from "../../../types"

interface RadarChartProps {
  mapWinRate: Record<string, MapWinRate>
  matchRecords: Record<string, MatchRecord[]>
  isDark: boolean
}

export function RadarChart({ mapWinRate, matchRecords, isDark }: RadarChartProps) {
  // TODO: Задание 1.1 — Подготовьте данные для радарной диаграммы
  // Документация: https://echarts.apache.org/en/option.html#series-radar
  //
  // Для каждой карты нужно вычислить 4 метрики:
  // 1. Винрейт (%) — из mapWinRate[map].rate
  // 2. Средний K/D — из matchRecords[map], аналогично computeMapPerformance в WinRateTable.tsx
  // 3. Средний ADR — из matchRecords[map]
  // 4. Средний HS% — из matchRecords[map]
  //
  // Формат данных для ECharts radar:
  // const maps = Object.keys(mapWinRate)
  //
  // const radarData = maps.map(map => {
  //   const wr = mapWinRate[map]
  //   const records = matchRecords[map] || []
  //   const withKd = records.filter(r => r.kdRatio !== undefined)
  //   const withAdr = records.filter(r => r.adr !== undefined)
  //   const withHs = records.filter(r => r.headshotPercent !== undefined)
  //
  //   return {
  //     map,
  //     winRate: wr.rate,
  //     avgKd: withKd.length > 0 ? +(withKd.reduce((s, r) => s + r.kdRatio!, 0) / withKd.length).toFixed(2) : 0,
  //     avgAdr: withAdr.length > 0 ? +(withAdr.reduce((s, r) => s + r.adr!, 0) / withAdr.length).toFixed(1) : 0,
  //     avgHs: withHs.length > 0 ? Math.round(withHs.reduce((s, r) => s + r.headshotPercent!, 0) / withHs.length) : 0,
  //   }
  // })

  // TODO: Задание 1.1 — Настройте конфигурацию ECharts radar
  // Документация: https://echarts.apache.org/en/option.html#series-radar
  //
  // const option = {
  //   title: {
  //     text: "Радарная диаграмма по картам",
  //     left: "center",
  //     textStyle: { color: isDark ? "#e5e7eb" : "#374151", fontSize: 14 },
  //   },
  //   tooltip: { trigger: "item" },
  //   legend: {
  //     data: maps.map(m => m.replace("de_", "")),
  //     bottom: 0,
  //     textStyle: { color: isDark ? "#9ca3af" : "#6b7280" },
  //   },
  //   radar: {
  //     indicator: [
  //       { name: "Win Rate", max: 100 },
  //       { name: "K/D", max: 2.0 },
  //       { name: "ADR", max: 120 },
  //       { name: "HS%", max: 80 },
  //     ],
  //     shape: "polygon",                    // "polygon" или "circle"
  //     splitNumber: 4,                       // количество концентрических линий
  //     axisName: { color: isDark ? "#9ca3af" : "#6b7280" },
  //   },
  //   series: [{
  //     type: "radar",
  //     data: radarData.map(d => ({
  //       value: [d.winRate, d.avgKd, d.avgAdr, d.avgHs],
  //       name: d.map.replace("de_", ""),
  //       areaStyle: { opacity: 0.15 },       // полупрозрачная заливка
  //     })),
  //   }],
  // }
  //
  // Подсказки:
  // - indicator задаёт оси радара (название + максимальное значение)
  // - Каждый элемент data — один многоугольник на диаграмме
  // - areaStyle делает заливку внутри многоугольника
  // - Аналог: посмотрите BanPickChart.tsx для паттерна использования ReactECharts

  const option = {}

  // Подавляем предупреждения о неиспользуемых переменных
  void mapWinRate
  void matchRecords
  void isDark

  return (
    <div className="my-4">
      <ReactECharts
        option={option}
        style={{ height: 400 }}
        opts={{ renderer: "canvas" }}
        theme={isDark ? "dark" : undefined}
      />
    </div>
  )
}
