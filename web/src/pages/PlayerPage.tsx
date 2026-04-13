import { Navigate, useParams } from "react-router-dom"
import { usePlayerData } from "@/features/theme-4-async/hooks/usePlayerData"
import { LoadingSpinner } from "@/components/core/LoadingSpinner"
import { ErrorMessage } from "@/components/core/ErrorMessage"
import { ReportView } from "@/components/ReportView"

export function PlayerPage() {
  const { nickname } = useParams<{ nickname: string }>()

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
      <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5">
        <LoadingSpinner />
      </div>
    )
  }

  return <ReportView data={data} basePath={`/player/${nickname}`} />
}
