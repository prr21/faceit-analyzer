import type { PlayerProfile, MapWinRate } from "../../types"
import { getStatColor } from "../../utils/colors"

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-gray-400",
  2: "bg-green-700",
  3: "bg-green-600",
  4: "bg-green-500",
  5: "bg-yellow-500",
  6: "bg-yellow-400",
  7: "bg-orange-400",
  8: "bg-orange-500",
  9: "bg-orange-600",
  10: "bg-red-500",
}

interface PlayerHeaderProps {
  profile: PlayerProfile
  totalMatches: number
  overallWinRate: Record<string, MapWinRate>
}

export function PlayerHeader({ profile, totalMatches, overallWinRate }: PlayerHeaderProps) {
  let totalWins = 0
  let totalLosses = 0
  for (const wr of Object.values(overallWinRate)) {
    totalWins += wr.wins
    totalLosses += wr.losses
  }
  const totalGames = totalWins + totalLosses
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

  return (
    <div className="flex items-center gap-4 mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Аватар */}
      {profile.avatar ? (
        <img
          src={profile.avatar}
          alt={profile.nickname}
          className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-2xl font-bold text-gray-500 dark:text-gray-400">
          {profile.nickname.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Инфо */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.nickname}</h1>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm ${LEVEL_COLORS[profile.skillLevel] ?? "bg-gray-500"}`}>
            {profile.skillLevel}
          </div>
        </div>
        <div className="flex gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <span className="font-semibold text-gray-800 dark:text-gray-200">{profile.currentElo} ELO</span>
          <span>{totalMatches} матчей</span>
          <span className={getStatColor(winRate, "winRate")}>{winRate}% побед</span>
          {profile.country && <span>{profile.country.toUpperCase()}</span>}
        </div>
      </div>
    </div>
  )
}
