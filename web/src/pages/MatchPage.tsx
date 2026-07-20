import { useState } from "react"
import { Navigate, useParams } from "react-router-dom"
import { useTheme } from "@/shared/hooks/useTheme"
import { ThemeToggle } from "@/shared/ui/ThemeToggle"
import { GlobalSearch } from "@/features/search/ui/GlobalSearch"
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner"
import { ErrorMessage } from "@/shared/ui/ErrorMessage"
import { useMatchAnalysis } from "@/features/match/model/useMatchAnalysis"
import { MatchHeader } from "@/features/match/ui/MatchHeader"
import { TeamRecommendationsCard } from "@/features/match/ui/TeamRecommendationsCard"
import { MapComparisonTable } from "@/features/match/ui/MapComparisonTable"
import { RosterCard } from "@/features/match/ui/RosterCard"
import { AiChatPanel } from "@/features/match/ai/ui/AiChatPanel"

type View = "analysis" | "ai"

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const tabs: { id: View; label: string }[] = [
    { id: "analysis", label: "Анализ" },
    { id: "ai", label: "AI-режим" },
  ]
  return (
    <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            view === t.id
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const { isDark, toggleTheme } = useTheme()
  const [view, setView] = useState<View>("analysis")

  const { data, isLoading, error, refetch } = useMatchAnalysis(matchId)

  if (!matchId) return <Navigate to="/" replace />

  const mapRecs = data?.insights.find(i => i.type === "map-recommendations")
  // picks содержат все карты пула — берём их как строки таблицы сравнения
  const poolMaps = mapRecs ? [...mapRecs.teams[0].picks.map(r => r.map)].sort() : []

  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5 font-sans text-gray-800 dark:text-gray-200">
      <div className="flex items-start justify-between gap-2 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Пре-матч анализ</h1>
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </div>

      {isLoading && (
        <LoadingSpinner message="Анализируем обе команды — первый запуск может занять несколько минут..." />
      )}

      {error && (
        <ErrorMessage
          message={error instanceof Error ? error.message : "Не удалось проанализировать матч"}
          onRetry={refetch}
        />
      )}

      {data && (
        <div className="space-y-4">
          <MatchHeader data={data} />

          <div className="flex justify-center">
            <ViewToggle view={view} onChange={setView} />
          </div>

          {view === "analysis" ? (
            <>
              {mapRecs && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TeamRecommendationsCard recs={mapRecs.teams[0]} />
                  <TeamRecommendationsCard recs={mapRecs.teams[1]} />
                </div>
              )}

              {poolMaps.length > 0 && <MapComparisonTable teams={data.teams} maps={poolMaps} />}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RosterCard team={data.teams[0]} />
                <RosterCard team={data.teams[1]} />
              </div>
            </>
          ) : (
            <AiChatPanel matchId={matchId} result={data} />
          )}
        </div>
      )}
    </div>
  )
}
