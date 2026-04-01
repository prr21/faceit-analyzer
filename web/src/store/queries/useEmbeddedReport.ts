import { useQuery } from "@tanstack/react-query"
import type { ReportData } from "@/types"
import { mockPlayerReport } from "@/__tests__/fixtures/mockData"

/**
 * Хук для чтения embedded-данных (window.__REPORT_DATA__).
 * В DEV-режиме без встроенных данных возвращает мок.
 * staleTime/gcTime = Infinity — embedded-данные никогда не устаревают.
 */
export function useEmbeddedReport() {
  return useQuery<ReportData | null>({
    queryKey: ["embedded-report"],
    queryFn: () =>
      window.__REPORT_DATA__ ??
      (import.meta.env.DEV ? mockPlayerReport : null),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
