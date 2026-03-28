import { useState } from "react"
import type { ReportData } from "./types"
import { useTheme } from "./hooks/useTheme"
import { Layout } from "./components/Layout"
import { TabNavigation } from "./components/TabNavigation"
import { ModeToggle } from "./components/ModeToggle"
import { BanPickTab } from "./components/tabs/BanPickTab"
import { WinrateTab } from "./components/tabs/WinrateTab"
import { TrendsTab } from "./components/tabs/TrendsTab"
import { MatchHistoryTab } from "./components/tabs/MatchHistoryTab"
import { OverviewTab } from "./components/tabs/OverviewTab"
import { RadarTab } from "./components/tabs/RadarTab"
import { CompareTab } from "./components/tabs/CompareTab"

const TEAM_TABS = ["Баны/Пики", "Винрейт", "Тренды", "Матчи", "Обзор", "Радар", "Сравнение"]
const LEADER_TABS = ["Баны/Пики", "Винрейт", "Тренды", "Матчи", "Обзор", "Радар", "Сравнение"]
const ALL_TABS = ["Винрейт", "Тренды", "Матчи", "Обзор", "Радар", "Сравнение"]

export function App({ data }: { data: ReportData }) {
  const [activeTab, setActiveTab] = useState(0)
  const [mode, setMode] = useState<"leader" | "all">("leader")
  const { isDark, toggleTheme } = useTheme()
  const { type, name, stats } = data

  const isPlayer = type === "player"
  const tabs = isPlayer ? (mode === "leader" ? LEADER_TABS : ALL_TABS) : TEAM_TABS

  function handleModeChange(newMode: "leader" | "all") {
    setMode(newMode)
    setActiveTab(0)
  }

  // Для player в режиме "all" нет таба "Баны/Пики", поэтому индексы сдвигаются
  const showBanPick = !isPlayer || mode === "leader"
  const tabOffset = showBanPick ? 0 : -1

  return (
    <Layout title={`Статистика — ${name}`} stats={stats} isDark={isDark} onToggleTheme={toggleTheme}>
      {isPlayer && <ModeToggle mode={mode} onModeChange={handleModeChange} />}
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {showBanPick && activeTab === 0 && (
        <BanPickTab type={type} name={name} stats={stats} isDark={isDark} />
      )}
      {activeTab === 1 + tabOffset && <WinrateTab stats={stats} mode={isPlayer ? mode : undefined} isDark={isDark} />}
      {activeTab === 2 + tabOffset && <TrendsTab stats={stats} mode={isPlayer ? mode : undefined} isDark={isDark} />}
      {activeTab === 3 + tabOffset && <MatchHistoryTab stats={stats} mode={isPlayer ? mode : undefined} isDark={isDark} />}
      {activeTab === 4 + tabOffset && <OverviewTab stats={stats} mode={isPlayer ? mode : undefined} isDark={isDark} />}
      {activeTab === 5 + tabOffset && <RadarTab stats={stats} mode={isPlayer ? mode : undefined} isDark={isDark} />}
      {activeTab === 6 + tabOffset && <CompareTab isDark={isDark} />}
    </Layout>
  )
}
