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

// TODO: Задание 6.1 — Динамическая загрузка данных
//
// Сейчас данные берутся из window.__REPORT_DATA__ (встроены в HTML при генерации).
// Задача: добавить альтернативный путь — загрузка через API по никнейму из URL.
//
// Пример URL: http://localhost:5173/?player=dErzz
//
// Шаги:
// 1. Создайте компонент-обёртку AppWithDynamicData:
//
// function AppWithDynamicData() {
//   // Получить nickname из URL search params
//   const params = new URLSearchParams(window.location.search)
//   const nickname = params.get("player") || ""
//
//   // Если есть предзагруженные данные — использовать их
//   const staticData = window.__REPORT_DATA__
//   if (staticData) {
//     return <App data={staticData} />
//   }
//
//   // Иначе — загрузить динамически
//   const { data, loading, error, refetch } = usePlayerData(nickname)
//
//   if (!nickname) {
//     return <div className="...">Укажите ?player=nickname в URL</div>
//   }
//   if (loading) return <LoadingSpinner />
//   if (error) return <ErrorMessage message={error} onRetry={refetch} />
//   if (!data) return null
//
//   return <App data={data} />
// }
//
// 2. Замените <App data={data} /> на <AppWithDynamicData /> в render()
//
// Импорты, которые понадобятся:
// import { usePlayerData } from "./hooks/usePlayerData"
// import { LoadingSpinner } from "./components/ui/LoadingSpinner"
// import { ErrorMessage } from "./components/ui/ErrorMessage"

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
