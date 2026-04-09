import type { EloSnapshot, StreakInfo } from "../../types/index"

/** Вычисляет longest win streak и текущую серию из хронологически отсортированного eloHistory */
export function calcStreaks(eloHistory: EloSnapshot[]): { longest: number; current: StreakInfo } {
  let longestWin = 0
  let currentCount = 0
  let currentType: "win" | "loss" = "win"

  for (const entry of eloHistory) {
    if (entry.result === currentType) {
      currentCount++
    } else {
      currentType = entry.result
      currentCount = 1
    }
    if (currentType === "win" && currentCount > longestWin) {
      longestWin = currentCount
    }
  }

  return {
    longest: longestWin,
    current: { type: currentType, count: currentCount },
  }
}
