import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "../../echarts-setup"
import type { FactionBanPickStats, MapCountRecord } from "../../types"

interface BanPickChartProps {
  title: string
  factionStats: FactionBanPickStats
  decider: MapCountRecord
  isDark: boolean
}

function collectAllMaps(stats: FactionBanPickStats, decider: MapCountRecord): string[] {
  return [
    ...new Set([
      ...Object.keys(stats.firstBan),
      ...Object.keys(stats.firstPick),
      ...Object.keys(stats.secondBan),
      ...Object.keys(stats.thirdBan),
      ...Object.keys(decider),
    ]),
  ]
}

export function BanPickChart({ title, factionStats, decider, isDark }: BanPickChartProps) {
  const maps = collectAllMaps(factionStats, decider)

  const option = {
    backgroundColor: "transparent",
    title: { text: title, left: "center" },
    tooltip: { trigger: "axis" as const },
    legend: { top: 30 },
    grid: { top: 80, bottom: 30 },
    xAxis: { type: "category" as const, data: maps },
    yAxis: { type: "value" as const, minInterval: 1 },
    series: [
      {
        name: "Первый бан",
        type: "bar" as const,
        data: maps.map(m => factionStats.firstBan[m] || 0),
        itemStyle: { color: "rgba(255, 99, 132, 0.7)" },
      },
      {
        name: "Второй бан (BO1)",
        type: "bar" as const,
        data: maps.map(m => factionStats.secondBan[m] || 0),
        itemStyle: { color: "rgba(230, 151, 62, 0.7)" },
      },
      {
        name: "Последний бан",
        type: "bar" as const,
        data: maps.map(m => factionStats.thirdBan[m] || 0),
        itemStyle: { color: "rgba(220, 223, 74, 0.7)" },
      },
      {
        name: "Первый пик (BO3)",
        type: "bar" as const,
        data: maps.map(m => factionStats.firstPick[m] || 0),
        itemStyle: { color: "rgba(153, 102, 255, 0.7)" },
      },
      {
        name: "Сыграно (десайдер)",
        type: "bar" as const,
        data: maps.map(m => decider[m] || 0),
        itemStyle: { color: "rgba(102, 255, 127, 0.7)" },
      },
    ],
    toolbox: {
      feature: { saveAsImage: { title: "Сохранить" } },
    },
  }

  return (
    <div className="overflow-x-auto">
      <div className="w-[700px] sm:w-auto h-[280px] sm:h-[400px]">
        <ReactEChartsCore echarts={echarts} option={option} theme={isDark ? "dark" : undefined} style={{ height: "100%" }} />
      </div>
    </div>
  )
}
