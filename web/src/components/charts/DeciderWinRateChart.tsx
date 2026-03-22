import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "../../echarts-setup"
import type { MapWinRate } from "../../types"

interface DeciderWinRateChartProps {
  deciderWinRate: Record<string, MapWinRate>
}

export function DeciderWinRateChart({ deciderWinRate }: DeciderWinRateChartProps) {
  const maps = Object.keys(deciderWinRate)
  if (maps.length === 0) return null

  const option = {
    title: { text: "Винрейт на десайдере", left: "center" },
    tooltip: {
      trigger: "axis" as const,
      formatter(params: Array<{ seriesName: string; value: number; axisValue: string }>) {
        const map = params[0].axisValue
        const wr = deciderWinRate[map]
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
        data: maps.map(m => deciderWinRate[m].wins),
        itemStyle: { color: "rgba(75, 192, 75, 0.7)" },
      },
      {
        name: "Поражения",
        type: "bar" as const,
        stack: "total",
        data: maps.map(m => deciderWinRate[m].losses),
        itemStyle: { color: "rgba(255, 75, 75, 0.7)" },
      },
    ],
    toolbox: {
      feature: { saveAsImage: { title: "Сохранить" } },
    },
  }

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 300 }} />
}
