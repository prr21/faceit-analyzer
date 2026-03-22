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
}

export function CompetitionPieChart({ compStats }: CompetitionPieChartProps) {
  const types = Object.keys(compStats)
  if (types.length === 0) return null

  const option = {
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

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 400, maxWidth: 500, margin: "0 auto" }} />
}
