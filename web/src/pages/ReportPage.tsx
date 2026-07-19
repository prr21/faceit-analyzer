import { Navigate, useParams } from "react-router-dom"
import type { ReportData } from "@/shared/types"
import { ReportView } from "@/features/report/ReportView"

// В DEV-режиме используем моковые данные
import { mockPlayerReport } from "@/shared/fixtures/mockData"

function getEmbeddedData(): ReportData | null {
  return window.__REPORT_DATA__ ?? (import.meta.env.DEV ? mockPlayerReport : null)
}

export function ReportPage() {
  const data = getEmbeddedData()

  if (!data) {
    return <Navigate to="/" replace />
  }

  return <ReportView data={data} basePath="/report" />
}
