import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useGlobalSearch } from "../model/useGlobalSearch"
import { playerPath, teamPath } from "@/shared/routing/paths"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TEAM_URL_RE = /faceit\.com\/[^/]+\/teams\/([0-9a-f-]{36})/i

function resolveTeamId(input: string): string | null {
  const trimmed = input.trim()
  if (UUID_RE.test(trimmed)) return trimmed.toLowerCase()
  const match = trimmed.match(TEAM_URL_RE)
  if (match) return match[1].toLowerCase()
  return null
}

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  // Парсинг UUID/URL команды — срабатывает мгновенно, без ожидания дебаунса.
  useEffect(() => {
    const teamId = resolveTeamId(query)
    if (teamId) {
      setQuery("")
      navigate(teamPath(teamId))
    }
  }, [query, navigate])

  const { data, isLoading, error } = useGlobalSearch(query)
  const players = data?.players ?? []
  const teams = data?.teams ?? []
  const hasResults = players.length > 0 || teams.length > 0

  const showDropdown =
    query.length >= 3 && (hasResults || error !== null || !isLoading)

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Поиск игрока или команды..."
        className="w-full sm:w-72 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />

      {isLoading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {showDropdown && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {error ? (
            <p className="p-3 text-sm text-red-500">
              {error instanceof Error ? error.message : "Ошибка поиска"}
            </p>
          ) : !hasResults ? (
            <p className="p-3 text-sm text-gray-400">Ничего не найдено</p>
          ) : (
            <>
              {players.length > 0 && (
                <div>
                  <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Игроки
                  </div>
                  {players.map(player => (
                    <Link
                      key={player.player_id}
                      to={playerPath(player.nickname)}
                      onClick={() => setQuery("")}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {player.avatar && (
                        <img
                          src={player.avatar}
                          alt={player.nickname}
                          className="w-8 h-8 rounded-full"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium">{player.nickname}</div>
                        <div className="text-xs text-gray-400">
                          Уровень {player.skill_level} · {player.country}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {teams.length > 0 && (
                <div>
                  <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Команды
                  </div>
                  {teams.map(team => (
                    <Link
                      key={team.team_id}
                      to={teamPath(team.team_id)}
                      onClick={() => setQuery("")}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {team.avatar && (
                        <img
                          src={team.avatar}
                          alt={team.name}
                          className="w-8 h-8 rounded"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium flex items-center gap-1">
                          {team.name}
                          {team.verified && (
                            <span className="text-[10px] text-blue-500">✓</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">Команда</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
