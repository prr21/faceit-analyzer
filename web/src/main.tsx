import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./echarts-setup"
import "./app.css"
import { App } from "./App"
import type { ReportData } from "./types"

declare global {
  interface Window {
    __REPORT_DATA__?: ReportData
  }
}

const data = window.__REPORT_DATA__

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {data ? (
      <App data={data} />
    ) : (
      <div className="max-w-[960px] mx-auto p-5 text-gray-500 dark:text-gray-400">
        <p>Нет данных для отображения. Запустите анализ через CLI.</p>
      </div>
    )}
  </StrictMode>,
)
