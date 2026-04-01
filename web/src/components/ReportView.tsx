import { useParams, useSearchParams, Navigate, useNavigate } from "react-router-dom"
import type { ReportData } from "@/types"
import { useTheme } from "@/hooks/useTheme"
import { getAvailableTabs, getDefaultTab, isValidTab } from "@/routing"
import { Layout } from "./Layout"
import { TabNavigation } from "./TabNavigation"
import { ModeToggle } from "./ModeToggle"
import { BanPickTab } from "./tabs/BanPickTab"
import { WinrateTab } from "./tabs/WinrateTab"
import { TrendsTab } from "./tabs/TrendsTab"
import { MatchHistoryTab } from "@/features/theme-1-frontend/tabs/MatchHistoryTab"
import { OverviewTab } from "./tabs/OverviewTab"
import { RadarTab } from "./tabs/RadarTab"
import { CompareTab } from "@/features/theme-5-dynamic/tabs/CompareTab"

interface ReportViewProps {
  data: ReportData
  basePath: string // e.g. "/report", "/player/dErzz", "/team/Satanics"
}

export function ReportView({ data, basePath }: ReportViewProps) {
  const { tab } = useParams<{ tab?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const { type, name, stats } = data
  const isPlayer = type === "player"

  const mode = (searchParams.get("mode") as "leader" | "all") || "leader"

  function handleModeChange(newMode: "leader" | "all") {
    const defaultTab = getDefaultTab(type, newMode)
    // Если текущий таб недоступен в новом режиме — перейти на первый
    const targetTab = tab && isValidTab(tab, type, newMode) ? tab : defaultTab
    navigate(`${basePath}/${targetTab}?mode=${newMode}`, { replace: true })
  }

  const tabs = getAvailableTabs(type, mode)
  const defaultTab = getDefaultTab(type, mode)

  // Нет таба или невалидный — редирект на дефолтный
  if (!tab || !isValidTab(tab, type, mode)) {
    const modeParam = mode !== "leader" ? `?mode=${mode}` : ""
    return <Navigate to={`${basePath}/${defaultTab}${modeParam}`} replace />
  }

  const modeForTabs = isPlayer ? mode : undefined

  return (
    <Layout title={`Статистика — ${name}`} stats={stats} isDark={isDark} onToggleTheme={toggleTheme}>
      {isPlayer && <ModeToggle mode={mode} onModeChange={handleModeChange} />}
      <TabNavigation tabs={tabs} basePath={basePath} mode={mode !== "leader" ? mode : undefined} />

      {tab === "bans" && <BanPickTab type={type} name={name} stats={stats} isDark={isDark} />}
      {tab === "winrate" && <WinrateTab stats={stats} mode={modeForTabs} isDark={isDark} />}
      {tab === "trends" && <TrendsTab stats={stats} mode={modeForTabs} isDark={isDark} />}
      {tab === "matches" && <MatchHistoryTab stats={stats} mode={modeForTabs} isDark={isDark} />}
      {tab === "overview" && <OverviewTab stats={stats} mode={modeForTabs} isDark={isDark} />}
      {tab === "radar" && <RadarTab stats={stats} mode={modeForTabs} isDark={isDark} />}
      {tab === "compare" && <CompareTab isDark={isDark} />}
    </Layout>
  )
}
