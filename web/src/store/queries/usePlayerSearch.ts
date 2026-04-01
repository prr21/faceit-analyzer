import { useState, useEffect } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { searchPlayers } from "../api/player"
import type { SearchResult } from "../api/player"

/**
 * Хук для поиска игроков с debounce.
 * Запрос отправляется только если query >= 3 символов.
 * keepPreviousData — сохраняет предыдущие результаты при вводе.
 */
export function usePlayerSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  return useQuery<SearchResult[]>({
    queryKey: ["player-search", debouncedQuery],
    queryFn: () => searchPlayers(debouncedQuery),
    enabled: debouncedQuery.length >= 3,
    placeholderData: keepPreviousData,
  })
}
