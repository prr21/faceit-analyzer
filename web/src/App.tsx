import { useState } from "react"
import type { ReportData, TeamDropPickStats, PlayerDropPickStats } from "./types"
import { Layout } from "./components/Layout"
import { TabNavigation } from "./components/TabNavigation"
import { BanPickTab } from "./components/tabs/BanPickTab"
import { WinrateTab } from "./components/tabs/WinrateTab"
import { TrendsTab } from "./components/tabs/TrendsTab"
import { OverviewTab } from "./components/tabs/OverviewTab"

const TABS = ["Баны/Пики", "Винрейт", "Тренды", "Обзор"]

export function App({ data }: { data: ReportData }) {
  const [activeTab, setActiveTab] = useState(0)
  const { type, name, stats } = data

  return (
    <Layout title={`Статистика — ${name}`} stats={stats}>
      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 0 && (
        <BanPickTab
          type={type}
          name={name}
          stats={stats}
        />
      )}
      {activeTab === 1 && <WinrateTab stats={stats} />}
      {activeTab === 2 && <TrendsTab stats={stats} />}
      {activeTab === 3 && <OverviewTab stats={stats} />}
    </Layout>
  )
}
