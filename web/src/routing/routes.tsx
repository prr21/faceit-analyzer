import { Routes, Route, Navigate } from "react-router-dom"
import { PATHS } from "./paths"
import { SearchPage } from "@/pages/SearchPage"
import { ReportPage } from "@/pages/ReportPage"
import { PlayerPage } from "@/pages/PlayerPage"
import { TeamPage } from "@/pages/TeamPage"
import { TeamRosterPage } from "@/pages/TeamRosterPage"

export function AppRoutes() {
  return (
    <Routes>
      <Route path={PATHS.home} element={<RootRedirect />} />
      <Route path={PATHS.report} element={<ReportPage />} />
      <Route path={PATHS.player} element={<PlayerPage />} />
      <Route path={PATHS.team} element={<TeamRosterPage />} />
      <Route path={PATHS.teamAnalysis} element={<TeamPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/** Если есть встроенные данные — перенаправить на /report, иначе показать поиск */
function RootRedirect() {
  if (window.__REPORT_DATA__) {
    return <Navigate to="/report" replace />
  }
  return <SearchPage />
}
