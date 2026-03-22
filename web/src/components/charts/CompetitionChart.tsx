import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "../../echarts-setup"
import type { CompetitionTypeStats } from "../../types"

interface CompetitionChartProps {
  compStats: CompetitionTypeStats
  isDark: boolean
}

export function CompetitionChart({ compStats, isDark }: CompetitionChartProps) {
  const types = Object.keys(compStats)
  if (types.length === 0) return null

  const option = {
    backgroundColor: "transparent",
    title: { text: "Винрейт по типу соревнования", left: "center" },
    tooltip: {
      trigger: "axis" as const,
      formatter(params: Array<{ seriesName: string; value: number; axisValue: string }>) {
        const type = params[0].axisValue
        const cs = compStats[type]
        let text = `<b>${type}</b><br/>`
        for (const p of params) {
          text += `${p.seriesName}: ${p.value}<br/>`
        }
        text += `Винрейт: ${cs.rate}% (${cs.total} игр)`
        return text
      },
    },
    legend: { top: 30 },
    grid: { top: 70, left: 120, bottom: 30 },
    xAxis: { type: "value" as const, minInterval: 1 },
    yAxis: { type: "category" as const, data: types },
    series: [
      {
        name: "Победы",
        type: "bar" as const,
        stack: "total",
        data: types.map(t => compStats[t].wins),
        itemStyle: { color: "rgba(75, 192, 75, 0.7)" },
      },
      {
        name: "Поражения",
        type: "bar" as const,
        stack: "total",
        data: types.map(t => compStats[t].losses),
        itemStyle: { color: "rgba(255, 75, 75, 0.7)" },
      },
    ],
    toolbox: {
      feature: { saveAsImage: { title: "Сохранить" } },
    },
  }

  return (
    <div className="overflow-x-auto">
      <div className="w-[600px] sm:w-auto h-[200px] sm:h-[250px]">
        <ReactEChartsCore echarts={echarts} option={option} theme={isDark ? "dark" : undefined} style={{ height: "100%" }} />
      </div>
    </div>
  )
}
