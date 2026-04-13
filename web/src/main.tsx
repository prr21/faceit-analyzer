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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
