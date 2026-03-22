import type { ReactNode } from "react"
import type { TeamDropPickStats, PlayerDropPickStats } from "../types"
import { ThemeToggle } from "./ThemeToggle"
import { PlayerHeader } from "./ui/PlayerHeader"

interface LayoutProps {
  title: string
  stats: TeamDropPickStats | PlayerDropPickStats
  isDark: boolean
  onToggleTheme: () => void
  children: ReactNode
}

function isPlayerStats(stats: TeamDropPickStats | PlayerDropPickStats): stats is PlayerDropPickStats {
  return "leaderMapWinRate" in stats
}

export function Layout({ title, stats, isDark, onToggleTheme, children }: LayoutProps) {
  const playerProfile = isPlayerStats(stats) ? stats.playerProfile : undefined

  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5 font-sans text-gray-800 dark:text-gray-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {playerProfile ? (
            <PlayerHeader
              profile={playerProfile}
              totalMatches={stats.allCount}
              overallWinRate={stats.mapWinRate}
            />
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-bold mb-1">{title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 my-1">{stats.mapInfo}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 my-1">
                Период: {stats.earliestGame} — {stats.latestGame} | Всего матчей: {stats.allCount}
              </p>
            </>
          )}
        </div>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
      {/* Подзаголовок с mapInfo для player с profileHeader */}
      {playerProfile && (
        <p className="text-sm text-gray-500 dark:text-gray-400 my-1">{stats.mapInfo}</p>
      )}
      {children}
    </div>
  )
}
