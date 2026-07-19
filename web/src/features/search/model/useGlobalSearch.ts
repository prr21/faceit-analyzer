import { useState, useEffect } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { searchAll } from "@/shared/api/endpoints"
import type { SearchAllResult } from "@/shared/api/endpoints"

/**
 * Совмещённый поиск по игрокам и командам.
 * Запрос отправляется, только если query >= 3 символов.
 * keepPreviousData — сохраняет предыдущие результаты при вводе.
 */
export function useGlobalSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  return useQuery<SearchAllResult>({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => searchAll(debouncedQuery),
    enabled: debouncedQuery.length >= 3,
    placeholderData: keepPreviousData,
  })
}
