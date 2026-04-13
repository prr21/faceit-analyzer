import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useDebounce } from "../hooks/useDebounce"

interface SearchResult {
  player_id: string
  nickname: string
  avatar: string
  country: string
  skill_level: number
}

export function PlayerSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([])
      setError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    async function search() {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error("Ошибка поиска")

        const data = await response.json()
        setResults(Array.isArray(data) ? data : data.items || [])
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Ошибка")
      } finally {
        setLoading(false)
      }
    }

    search()
    return () => controller.abort()
  }, [debouncedQuery])

  const showDropdown = query.length >= 3 && (results.length > 0 || error !== null || (!loading && debouncedQuery.length >= 3))

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Поиск игрока..."
        className="w-full sm:w-64 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />

      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {showDropdown && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {error ? (
            <p className="p-3 text-sm text-red-500">{error}</p>
          ) : results.length > 0 ? (
            results.map(player => (
              <Link
                key={player.player_id}
                to={`/player/${player.nickname}`}
                onClick={() => { setQuery(""); setResults([]) }}
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
            ))
          ) : (
            !loading && <p className="p-3 text-sm text-gray-400">Ничего не найдено</p>
          )}
        </div>
      )}
    </div>
  )
}
