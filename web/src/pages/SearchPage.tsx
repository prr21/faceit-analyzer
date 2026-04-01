import { useTheme } from "@/hooks/useTheme"
import { ThemeToggle } from "@/components/ThemeToggle"
import { PlayerSearch } from "@/features/theme-4-async/ui/PlayerSearch"

export function SearchPage() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5 font-sans text-gray-800 dark:text-gray-200">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">FACEIT Аналитика</h1>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>

      <div className="flex flex-col items-center gap-6 mt-16">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Введите никнейм игрока для анализа статистики
        </p>
        <div className="w-full max-w-md">
          <PlayerSearch />
        </div>
      </div>
    </div>
  )
}
