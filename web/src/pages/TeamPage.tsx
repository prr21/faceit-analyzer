import { Link, Navigate, useParams } from "react-router-dom"
import { useCachedTeamAnalysis } from "@/features/team/model/useTeamAnalysis"
import { ReportView } from "@/features/report/ReportView"
import { teamAnalysisPath, teamPath } from "@/shared/routing/paths"

export function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>()

  // 1) Кеш от мутации «Анализировать» на TeamRosterPage.
  const { data: cached } = useCachedTeamAnalysis(teamId)

  if (!teamId) {
    return <Navigate to="/" replace />
  }

  if (cached) {
    return <ReportView data={cached} basePath={teamAnalysisPath(teamId)} />
  }

  // 2) Статический CLI-отчёт (встроенные данные в HTML).
  const embedded = window.__REPORT_DATA__
  if (embedded && embedded.type === "team") {
    return <ReportView data={embedded} basePath={teamAnalysisPath(teamId)} />
  }

  // 3) Нет данных — отправляем пользователя на страницу выбора ростера.
  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5 text-gray-500 dark:text-gray-400">
      <p className="mb-3">
        Анализ команды ещё не запускался в этой сессии. Откройте страницу ростера
        и выберите игроков.
      </p>
      <Link
        to={teamPath(teamId)}
        className="inline-block px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Перейти к ростеру
      </Link>
    </div>
  )
}
