export interface TabDef {
  slug: string
  label: string
}

const ALL_TABS: TabDef[] = [
  { slug: "bans", label: "Баны/Пики" },
  { slug: "winrate", label: "Винрейт" },
  { slug: "trends", label: "Тренды" },
  { slug: "matches", label: "Матчи" },
  { slug: "overview", label: "Обзор" },
]

/** Табы, доступные для данного типа отчёта и режима */
export function getAvailableTabs(
  type: "player" | "team",
  mode: "leader" | "all" = "leader",
): TabDef[] {
  // В режиме "all" у игрока нет таба "Баны/Пики"
  if (type === "player" && mode === "all") {
    return ALL_TABS.filter(t => t.slug !== "bans")
  }
  return ALL_TABS
}

/** Первый таб по умолчанию */
export function getDefaultTab(type: "player" | "team", mode: "leader" | "all" = "leader"): string {
  return getAvailableTabs(type, mode)[0].slug
}

/** Проверить, что slug — допустимый таб */
export function isValidTab(
  slug: string,
  type: "player" | "team",
  mode: "leader" | "all" = "leader",
): boolean {
  return getAvailableTabs(type, mode).some(t => t.slug === slug)
}
