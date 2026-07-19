import { useState, useEffect } from "react"

function getInitialDark(): boolean {
  try {
    const stored = localStorage.getItem("theme")
    if (stored === "dark") return true
    if (stored === "light") return false
  } catch {}
  return matchMedia("(prefers-color-scheme: dark)").matches
}

export function useTheme() {
  const [isDark, setIsDark] = useState(getInitialDark)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light")
    } catch {}
  }, [isDark])

  function toggleTheme() {
    setIsDark(prev => !prev)
  }

  return { isDark, toggleTheme }
}
