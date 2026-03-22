import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "../../echarts-setup"
import type { TrendPeriod } from "../../types"

interface MatchCountChartProps {
  trends: TrendPeriod[]
}

export function MatchCountChart({ trends }: MatchCountChartProps) {
  if (trends.length < 2) return null

  const option = {
    title: { text: "Количество матчей по месяцам", left: "center" },
    tooltip: { trigger: "axis" as const },
    grid: { top: 50, bottom: 30 },
    xAxis: { type: "category" as const, data: trends.map(t => t.label) },
    yAxis: { type: "value" as const, minInterval: 1 },
    series: [
      {
        type: "bar" as const,
        data: trends.map(t => t.matchCount),
        itemStyle: { color: "rgba(54, 162, 235, 0.7)" },
      },
    ],
    toolbox: {
      feature: { saveAsImage: { title: "Сохранить" } },
    },
  }

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 250 }} />
}
