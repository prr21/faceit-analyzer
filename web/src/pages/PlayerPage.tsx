import { Navigate, useParams } from "react-router-dom"
import { usePlayerReport } from "@/features/report/model/usePlayerReport"
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner"
import { ErrorMessage } from "@/shared/ui/ErrorMessage"
import { ReportView } from "@/features/report/ReportView"

export function PlayerPage() {
  const { nickname } = useParams<{ nickname: string }>()

  const { data, isLoading, error, refetch } = usePlayerReport(nickname ?? "")

  if (!nickname) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return (
      <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5">
        <ErrorMessage
          message={error instanceof Error ? error.message : "Неизвестная ошибка"}
          onRetry={refetch}
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5">
        <LoadingSpinner />
      </div>
    )
  }

  return <ReportView data={data} basePath={`/player/${nickname}`} />
}
