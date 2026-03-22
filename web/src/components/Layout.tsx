import type { ReactNode } from "react"
import type { TeamDropPickStats, PlayerDropPickStats } from "../types"

interface LayoutProps {
  title: string
  stats: TeamDropPickStats | PlayerDropPickStats
  children: ReactNode
}

export function Layout({ title, stats, children }: LayoutProps) {
  return (
    <div className="max-w-[960px] mx-auto px-5 py-5 font-sans text-gray-800">
      <h1 className="text-2xl font-bold mb-1">{title}</h1>
      <p className="text-sm text-gray-500 my-1">{stats.mapInfo}</p>
      <p className="text-sm text-gray-500 my-1">
        Период: {stats.earliestGame} — {stats.latestGame} | Всего матчей: {stats.allCount}
      </p>
      {children}
    </div>
  )
}
