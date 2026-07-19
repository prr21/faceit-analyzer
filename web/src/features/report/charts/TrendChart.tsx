import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "@/shared/lib/echarts-setup"
import type { TrendPeriod } from "@/shared/types"

const MAP_COLORS = [
  "#ff6384", "#36a2eb", "#ffce56", "#4bc0c0",
  "#9966ff", "#ff9f40", "#c7c7c7", "#5366ff",
]

interface TrendChartProps {
  title: string
  trends: TrendPeriod[]
  dataKey: "firstBan" | "firstPick" | "secondBan" | "thirdBan"
  isDark: boolean
}

export function TrendChart({ title, trends, dataKey, isDark }: TrendChartProps) {
  if (trends.length < 2) return null

  const labels = trends.map(t => t.label)
  const allMaps = [...new Set(trends.flatMap(t => Object.keys(t.stats[dataKey])))]

  const series = allMaps.map((mapName, i) => ({
    name: mapName,
    type: "line" as const,
    data: trends.map(t => t.stats[dataKey][mapName] || 0),
    smooth: true,
    lineStyle: { color: MAP_COLORS[i % MAP_COLORS.length] },
    itemStyle: { color: MAP_COLORS[i % MAP_COLORS.length] },
  }))

  const option = {
    backgroundColor: "transparent",
    title: { text: title, left: "center" },
    tooltip: { trigger: "axis" as const },
    legend: { top: 30 },
    grid: { top: 80, bottom: 30 },
    xAxis: { type: "category" as const, data: labels },
    yAxis: { type: "value" as const, minInterval: 1 },
    series,
    toolbox: {
      feature: { saveAsImage: { title: "Сохранить" } },
    },
  }

  return (
    <div className="h-[250px] sm:h-[350px]">
      <ReactEChartsCore echarts={echarts} option={option} theme={isDark ? "dark" : undefined} style={{ height: "100%" }} />
    </div>
  )
}
