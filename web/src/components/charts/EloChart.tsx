import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "../../echarts-setup"
import type { EloSnapshot } from "../../types"

interface EloChartProps {
  eloHistory: EloSnapshot[]
}

export function EloChart({ eloHistory }: EloChartProps) {
  if (eloHistory.length < 2) return null

  const labels = eloHistory.map(e => new Date(e.date * 1000).toLocaleDateString("ru-RU"))
  const eloData = eloHistory.map(e => e.elo)
  const pointColors = eloHistory.map(e => (e.result === "win" ? "#4bc04b" : "#ff4b4b"))

  const option = {
    title: { text: "Динамика ELO", left: "center" },
    tooltip: {
      trigger: "axis" as const,
      formatter(params: Array<{ dataIndex: number; value: number; axisValue: string }>) {
        const p = params[0]
        const snap = eloHistory[p.dataIndex]
        return `${p.axisValue}<br/>ELO: <b>${p.value}</b><br/>Результат: ${snap.result === "win" ? "Победа" : "Поражение"}`
      },
    },
    grid: { top: 50, bottom: 60 },
    xAxis: {
      type: "category" as const,
      data: labels,
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: "value" as const },
    series: [
      {
        type: "line" as const,
        data: eloData,
        smooth: 0.2,
        lineStyle: { color: "#36a2eb" },
        itemStyle: {
          color(params: { dataIndex: number }) {
            return pointColors[params.dataIndex]
          },
        },
        symbolSize: 6,
      },
    ],
    dataZoom: [
      {
        type: "slider" as const,
        start: 0,
        end: 100,
        bottom: 10,
      },
    ],
    toolbox: {
      feature: { saveAsImage: { title: "Сохранить" } },
    },
  }

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 400 }} />
}
