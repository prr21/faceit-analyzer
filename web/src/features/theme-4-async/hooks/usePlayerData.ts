import { useState, useEffect } from "react"
import type { ReportData } from "@/types"

interface UsePlayerDataResult {
  data: ReportData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function usePlayerData(nickname: string): UsePlayerDataResult {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchCount, setFetchCount] = useState(0)

  function refetch() {
    setFetchCount(c => c + 1)
  }

  useEffect(() => {
    if (!nickname) return

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    async function loadData() {
      try {
        const response = await fetch(
          `/api/player/${encodeURIComponent(nickname)}/analysis`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? `Игрок "${nickname}" не найден`
              : `Ошибка сервера: ${response.status}`,
          )
        }

        const result: ReportData = await response.json()
        setData(result)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Неизвестная ошибка")
      } finally {
        setLoading(false)
      }
    }

    loadData()

    return () => controller.abort()
  }, [nickname, fetchCount])

  return { data, loading, error, refetch }
}
