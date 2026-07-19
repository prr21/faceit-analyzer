import ReactEChartsCore from "echarts-for-react/lib/core"
import echarts from "@/shared/lib/echarts-setup"
import type { EloSnapshot } from "@/shared/types"

interface EloChartProps {
  eloHistory: EloSnapshot[]
  isDark: boolean
}

export function EloChart({ eloHistory, isDark }: EloChartProps) {
  if (eloHistory.length < 2) return null

  const labels = eloHistory.map(e => new Date(e.date * 1000).toLocaleDateString("ru-RU"))
  const eloData = eloHistory.map(e => e.elo)
  const pointColors = eloHistory.map(e => (e.result === "win" ? "#4bc04b" : "#ff4b4b"))

  const maxElo = Math.max(...eloData)
  const minElo = Math.min(...eloData)
  const maxIdx = eloData.indexOf(maxElo)
  const minIdx = eloData.indexOf(minElo)
  const wins = eloHistory.filter(e => e.result === "win").length
  const losses = eloHistory.filter(e => e.result === "loss").length
  const eloChange = eloData[eloData.length - 1] - eloData[0]

  const option = {
    backgroundColor: "transparent",
    title: {
      text: "Динамика ELO",
      subtext: `W ${wins} / L ${losses}  |  ELO: ${eloChange >= 0 ? "+" : ""}${eloChange}  |  Max: ${maxElo}  Min: ${minElo}`,
      left: "center",
    },
    tooltip: {
      trigger: "axis" as const,
      formatter(params: Array<{ dataIndex: number; value: number; axisValue: string }>) {
        const p = params[0]
        const snap = eloHistory[p.dataIndex]
        return `${p.axisValue}<br/>ELO: <b>${p.value}</b><br/>Результат: ${snap.result === "win" ? "Победа" : "Поражение"}`
      },
    },
    grid: { top: 60, bottom: 60 },
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
        markPoint: {
          data: [
            {
              coord: [maxIdx, maxElo],
              value: maxElo,
              itemStyle: { color: "#4bc04b" },
              label: { formatter: "{c}", color: "#fff" },
            },
            {
              coord: [minIdx, minElo],
              value: minElo,
              symbol: "pin",
              symbolRotate: 180,
              itemStyle: { color: "#ff4b4b" },
              label: { formatter: "{c}", color: "#fff", offset: [0, 8] },
            },
          ],
          symbolSize: 40,
        },
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

  return (
    <div className="h-[280px] sm:h-[400px]">
      <ReactEChartsCore echarts={echarts} option={option} theme={isDark ? "dark" : undefined} style={{ height: "100%" }} />
    </div>
  )
}
