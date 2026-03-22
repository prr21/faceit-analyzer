import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "../../echarts-setup"
import type { CompetitionTypeStats } from "../../types"

const PIE_COLORS = [
  "rgba(54, 162, 235, 0.8)",
  "rgba(255, 206, 86, 0.8)",
  "rgba(153, 102, 255, 0.8)",
  "rgba(255, 159, 64, 0.8)",
]

interface CompetitionPieChartProps {
  compStats: CompetitionTypeStats
  isDark: boolean
}

export function CompetitionPieChart({ compStats, isDark }: CompetitionPieChartProps) {
  const types = Object.keys(compStats)
  if (types.length === 0) return null

  const option = {
    backgroundColor: "transparent",
    title: { text: "Распределение по типу соревнования", left: "center" },
    tooltip: {
      trigger: "item" as const,
      formatter: "{b}: {c} ({d}%)",
    },
    legend: { top: 30 },
    series: [
      {
        type: "pie" as const,
        radius: ["40%", "70%"],
        center: ["50%", "60%"],
        data: types.map((t, i) => ({
          name: t,
          value: compStats[t].total,
          itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] },
        })),
        label: { show: true, formatter: "{b}: {d}%" },
      },
    ],
    toolbox: {
      feature: { saveAsImage: { title: "Сохранить" } },
    },
  }

  return (
    <div className="h-[300px] sm:h-[400px] max-w-[500px] mx-auto">
      <ReactEChartsCore echarts={echarts} option={option} theme={isDark ? "dark" : undefined} style={{ height: "100%" }} />
    </div>
  )
}
