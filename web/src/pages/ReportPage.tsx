import { Navigate, useParams } from "react-router-dom"
import type { ReportData } from "@/types"
import { ReportView } from "@/components/ReportView"

// В DEV-режиме используем моковые данные
import { mockPlayerReport } from "@/__tests__/fixtures/mockData"

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
