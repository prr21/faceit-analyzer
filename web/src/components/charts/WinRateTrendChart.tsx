import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "../../echarts-setup"
import type { TrendPeriod } from "../../types"

const MAP_COLORS = [
  "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0",
  "#9966ff", "#ff9f40", "#c7c7c7", "#5366ff",
]

interface WinRateTrendChartProps {
  trends: TrendPeriod[]
}

export function WinRateTrendChart({ trends }: WinRateTrendChartProps) {
  if (trends.length < 2) return null

  const labels = trends.map(t => t.label)
  const allMaps = [...new Set(trends.flatMap(t => Object.keys(t.mapWinRate)))]

  const series = allMaps.map((mapName, i) => ({
    name: mapName,
    type: "line" as const,
    data: trends.map(t => t.mapWinRate[mapName]?.rate ?? null),
    smooth: true,
    connectNulls: true,
    lineStyle: { color: MAP_COLORS[i % MAP_COLORS.length] },
    itemStyle: { color: MAP_COLORS[i % MAP_COLORS.length] },
  }))

  const option = {
    title: { text: "Тренды винрейта по месяцам (%)", left: "center" },
    tooltip: { trigger: "axis" as const },
    legend: { top: 30 },
    grid: { top: 80, bottom: 30 },
    xAxis: { type: "category" as const, data: labels },
    yAxis: { type: "value" as const, min: 0, max: 100 },
    series,
    toolbox: {
      feature: { saveAsImage: { title: "Сохранить" } },
    },
  }

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 350 }} />
}
