import { create } from "zustand"

function getInitialDark(): boolean {
  try {
    const stored = localStorage.getItem("theme")
    if (stored === "dark") return true
    if (stored === "light") return false
  } catch {
    /* localStorage недоступен */
  }
  return matchMedia("(prefers-color-scheme: dark)").matches
}

interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>(set => ({
  isDark: getInitialDark(),
  toggleTheme: () => set(state => ({ isDark: !state.isDark })),
}))

// Side-effect: синхронизация с DOM и localStorage
useThemeStore.subscribe(({ isDark }) => {
  const root = document.documentElement
  if (isDark) {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
  try {
    localStorage.setItem("theme", isDark ? "dark" : "light")
  } catch {
    /* localStorage недоступен */
  }
})

// Инициализация: применить тему при загрузке модуля
const { isDark } = useThemeStore.getState()
if (isDark) {
  document.documentElement.classList.add("dark")
}
