import { Navigate, useParams } from "react-router-dom"
import { usePlayerData } from "@/features/theme-4-async/hooks/usePlayerData"
import { LoadingSpinner } from "@/components/core/LoadingSpinner"
import { ErrorMessage } from "@/components/core/ErrorMessage"
import { ReportView } from "@/components/ReportView"

export function PlayerPage() {
  const { nickname } = useParams<{ nickname: string }>()

  // TODO: Задание 4.1 — usePlayerData загружает данные по никнейму
  // Сейчас хук-заглушка (data всегда null). После реализации задания 4.1
  // данные будут подгружаться автоматически при переходе на /player/:nickname
  const { data, loading, error, refetch } = usePlayerData(nickname ?? "")

  if (!nickname) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5">
        <ErrorMessage message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5 text-gray-500 dark:text-gray-400">
        <p>Загрузка данных для «{nickname}»... Реализуйте задание 4.1 для динамической загрузки.</p>
      </div>
    )
  }

  return <ReportView data={data} basePath={`/player/${nickname}`} />
}
