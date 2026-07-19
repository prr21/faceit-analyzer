/** Шаблоны маршрутов для react-router */
export const PATHS = {
  home: "/",
  report: "/report/:tab?",
  player: "/player/:nickname/:tab?",
  team: "/team/:teamId",
  teamAnalysis: "/team/:teamId/analysis/:tab?",
} as const

/** URL для страницы отчёта (embedded data) */
export function reportPath(tab?: string): string {
  return `/report${tab ? `/${tab}` : ""}`
}

/** URL для страницы игрока */
export function playerPath(nickname: string, tab?: string): string {
  return `/player/${encodeURIComponent(nickname)}${tab ? `/${tab}` : ""}`
}

/** URL страницы выбора ростера перед анализом команды */
export function teamPath(teamId: string): string {
  return `/team/${encodeURIComponent(teamId)}`
}

/** URL страницы анализа уже выбранной подборки команды */
export function teamAnalysisPath(teamId: string, tab?: string): string {
  return `/team/${encodeURIComponent(teamId)}/analysis${tab ? `/${tab}` : ""}`
}
