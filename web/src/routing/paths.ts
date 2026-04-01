/** Шаблоны маршрутов для react-router */
export const PATHS = {
  home: "/",
  report: "/report/:tab?",
  player: "/player/:nickname/:tab?",
  team: "/team/:name/:tab?",
} as const

/** URL для страницы отчёта (embedded data) */
export function reportPath(tab?: string): string {
  return `/report${tab ? `/${tab}` : ""}`
}

/** URL для страницы игрока */
export function playerPath(nickname: string, tab?: string): string {
  return `/player/${encodeURIComponent(nickname)}${tab ? `/${tab}` : ""}`
}

/** URL для страницы команды */
export function teamPath(name: string, tab?: string): string {
  return `/team/${encodeURIComponent(name)}${tab ? `/${tab}` : ""}`
}
