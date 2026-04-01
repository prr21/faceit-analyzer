import { Navigate, useParams } from "react-router-dom"
import type { ReportData } from "@/types"
import { ReportView } from "@/components/ReportView"

export function TeamPage() {
  const { name } = useParams<{ name: string }>()

  if (!name) {
    return <Navigate to="/" replace />
  }

  // Пока команды загружаются только через embedded data
  // TODO: добавить динамическую загрузку команд через API
  const data = window.__REPORT_DATA__

  if (!data || data.type !== "team") {
    return (
      <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5 text-gray-500 dark:text-gray-400">
        <p>Данные для команды «{name}» не найдены. Запустите анализ через CLI.</p>
      </div>
    )
  }

  return <ReportView data={data} basePath={`/team/${name}`} />
}
