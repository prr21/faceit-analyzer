import { useEffect, useMemo, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { useTheme } from "@/shared/hooks/useTheme"
import { ThemeToggle } from "@/shared/ui/ThemeToggle"
import { GlobalSearch } from "@/features/search/ui/GlobalSearch"
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner"
import { ErrorMessage } from "@/shared/ui/ErrorMessage"
import { useAnalyzeTeamMutation } from "@/features/team/model/useTeamAnalysis"
import { useTeamRoster } from "@/features/team/model/useTeamRoster"
import { teamAnalysisPath } from "@/shared/routing/paths"

const MIN_SELECTED = 2
const MAX_SELECTED = 5

export function TeamRosterPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const { data: team, isLoading, error, refetch } = useTeamRoster(teamId)
  const analyze = useAnalyzeTeamMutation(teamId)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Инициализируем «все отмечены» при первой загрузке ростера.
  useEffect(() => {
    if (team) {
      setSelected(new Set(team.members.map(m => m.player_id)))
    }
  }, [team])

  const selectedCount = selected.size
  const canAnalyze =
    selectedCount >= MIN_SELECTED && selectedCount <= MAX_SELECTED

  const sortedMembers = useMemo(
    () => (team ? [...team.members].sort((a, b) => b.skill_level - a.skill_level) : []),
    [team],
  )

  if (!teamId) return <Navigate to="/" replace />

  function toggle(playerId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  async function handleAnalyze() {
    if (!team || !canAnalyze) return
    try {
      await analyze.mutateAsync({
        teamName: team.name,
        playerIds: Array.from(selected),
      })
      navigate(teamAnalysisPath(team.team_id))
    } catch {
      // ошибка уже в analyze.error
    }
  }

  return (
    <div className="max-w-[960px] mx-auto px-3 sm:px-5 py-4 sm:py-5 font-sans text-gray-800 dark:text-gray-200">
      <div className="flex items-start justify-between gap-2 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">
          {team ? `Команда — ${team.name}` : "Команда"}
        </h1>
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {error && (
        <ErrorMessage
          message={error instanceof Error ? error.message : "Не удалось загрузить команду"}
          onRetry={refetch}
        />
      )}

      {team && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Выберите игроков, по которым будет считаться статистика. Анализируются матчи,
            где как минимум трое из выбранных играли вместе (или все выбранные — если их меньше трёх).
          </p>

          <ul className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
            {sortedMembers.map(member => {
              const checked = selected.has(member.player_id)
              return (
                <li key={member.player_id}>
                  <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(member.player_id)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.nickname}
                        className="w-8 h-8 rounded-full"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{member.nickname}</div>
                      <div className="text-xs text-gray-400">
                        Уровень {member.skill_level}
                        {member.country ? ` · ${member.country}` : ""}
                      </div>
                    </div>
                  </label>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <p
              className={`text-sm ${canAnalyze ? "text-gray-600 dark:text-gray-300" : "text-amber-600 dark:text-amber-400"}`}
            >
              Выбрано: {selectedCount} (нужно от {MIN_SELECTED} до {MAX_SELECTED})
            </p>
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || analyze.isPending}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {analyze.isPending ? "Анализируем..." : "Анализировать"}
            </button>
          </div>

          {analyze.error && (
            <p className="text-sm text-red-500 mt-3">
              {analyze.error instanceof Error ? analyze.error.message : "Ошибка анализа"}
            </p>
          )}
        </>
      )}
    </div>
  )
}
