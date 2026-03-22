import type { FavoriteUnderdogStats } from "../../types"
import { Card } from "./Card"

interface FavoriteUnderdogCardsProps {
  stats: FavoriteUnderdogStats
}

export function FavoriteUnderdogCards({ stats }: FavoriteUnderdogCardsProps) {
  return (
    <div className="flex gap-4 flex-wrap my-4">
      <Card
        title="Как фаворит"
        value={`${stats.asFavorite.rate}%`}
        valueColor={stats.asFavorite.rate >= 50 ? "green" : "red"}
        subtitle={`${stats.asFavorite.wins}W / ${stats.asFavorite.losses}L (${stats.asFavorite.total} игр)`}
      />
      <Card
        title="Как андердог"
        value={`${stats.asUnderdog.rate}%`}
        valueColor={stats.asUnderdog.rate >= 50 ? "green" : "red"}
        subtitle={`${stats.asUnderdog.wins}W / ${stats.asUnderdog.losses}L (${stats.asUnderdog.total} игр)`}
      />
    </div>
  )
}
