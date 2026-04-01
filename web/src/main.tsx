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

// TODO: Задание 4.1 — Динамическая загрузка данных
// Документация: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API, https://developer.mozilla.org/en-US/docs/Web/API/AbortController
//
// - #/report      → встроенные данные (window.__REPORT_DATA__) или mock в DEV
// - #/player/:nickname → динамическая загрузка через usePlayerData (задание 4.1)
//
// Для реализации динамической загрузки см. src/pages/PlayerPage.tsx
// и src/features/theme-4-async/hooks/usePlayerData.ts

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
