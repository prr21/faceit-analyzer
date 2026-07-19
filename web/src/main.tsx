import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/shared/lib/echarts-setup"
import "./app/app.css"
import { App } from "./app/App"
import type { ReportData } from "@/shared/types"

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
