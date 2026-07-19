import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "@/shared/lib/echarts-setup"
import type { MapWinRate } from "@/shared/types"

interface WinRateChartProps {
  winRate: Record<string, MapWinRate>
  isDark: boolean
}

export function WinRateChart({ winRate, isDark }: WinRateChartProps) {
  const maps = Object.keys(winRate)
  if (maps.length === 0) return null

  const option = {
    backgroundColor: "transparent",
    title: { text: "Винрейт по картам", left: "center" },
    tooltip: {
      trigger: "axis" as const,
      formatter(params: Array<{ seriesName: string; value: number; axisValue: string }>) {
        const map = params[0].axisValue
        const wr = winRate[map]
        let text = `<b>${map}</b><br/>`
        for (const p of params) {
          text += `${p.seriesName}: ${p.value}<br/>`
        }
        text += `Винрейт: ${wr.rate}% (${wr.total} игр)`
        return text
      },
    },
    legend: { top: 30 },
    grid: { top: 70, bottom: 30 },
    xAxis: { type: "category" as const, data: maps },
    yAxis: { type: "value" as const, minInterval: 1 },
    series: [
      {
        name: "Победы",
        type: "bar" as const,
        stack: "total",
        data: maps.map(m => winRate[m].wins),
        itemStyle: { color: "rgba(75, 192, 75, 0.7)" },
      },
      {
        name: "Поражения",
        type: "bar" as const,
        stack: "total",
        data: maps.map(m => winRate[m].losses),
        itemStyle: { color: "rgba(255, 75, 75, 0.7)" },
      },
    ],
    toolbox: {
      feature: { saveAsImage: { title: "Сохранить" } },
    },
  }

  return (
    <div className="overflow-x-auto">
      <div className="w-[600px] sm:w-auto h-[280px] sm:h-[400px]">
        <ReactEChartsCore echarts={echarts} option={option} theme={isDark ? "dark" : undefined} style={{ height: "100%" }} />
      </div>
    </div>
  )
}
