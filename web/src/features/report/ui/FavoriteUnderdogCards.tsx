import type { FavoriteUnderdogStats } from "@/shared/types"
import { Card } from "@/shared/ui/Card"
import { getStatColor } from "@/shared/lib/colors"

interface FavoriteUnderdogCardsProps {
  stats: FavoriteUnderdogStats
}

export function FavoriteUnderdogCards({ stats }: FavoriteUnderdogCardsProps) {
  return (
    <div className="flex gap-2 sm:gap-4 flex-wrap my-4">
      <Card
        title="Как фаворит"
        value={`${stats.asFavorite.rate}%`}
        valueColor={getStatColor(stats.asFavorite.rate, "winRate")}
        subtitle={`${stats.asFavorite.wins}W / ${stats.asFavorite.losses}L (${stats.asFavorite.total} игр)`}
      />
      <Card
        title="Как андердог"
        value={`${stats.asUnderdog.rate}%`}
        valueColor={getStatColor(stats.asUnderdog.rate, "winRate")}
        subtitle={`${stats.asUnderdog.wins}W / ${stats.asUnderdog.losses}L (${stats.asUnderdog.total} игр)`}
      />
    </div>
  )
}
