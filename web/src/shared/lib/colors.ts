export type StatType = "winRate" | "kd" | "adr" | "hs"

interface Tier {
  min: number
  text: string
  bg: string
}

const TIERS: Record<StatType, Tier[]> = {
  winRate: [
    { min: 55, text: "text-green-600 dark:text-green-400", bg: "bg-green-500" },
    { min: 50, text: "text-gray-700 dark:text-gray-300", bg: "bg-yellow-400" },
    { min: 40, text: "text-orange-500 dark:text-orange-400", bg: "bg-orange-400" },
    { min: -Infinity, text: "text-red-500 dark:text-red-400", bg: "bg-red-400" },
  ],
  kd: [
    { min: 1.1, text: "text-green-600 dark:text-green-400", bg: "bg-green-500" },
    { min: 1.0, text: "text-gray-700 dark:text-gray-300", bg: "bg-yellow-400" },
    { min: 0.8, text: "text-orange-500 dark:text-orange-400", bg: "bg-orange-400" },
    { min: -Infinity, text: "text-red-500 dark:text-red-400", bg: "bg-red-400" },
  ],
  adr: [
    { min: 85, text: "text-green-600 dark:text-green-400", bg: "bg-green-500" },
    { min: 75, text: "text-gray-700 dark:text-gray-300", bg: "bg-yellow-400" },
    { min: 60, text: "text-orange-500 dark:text-orange-400", bg: "bg-orange-400" },
    { min: -Infinity, text: "text-red-500 dark:text-red-400", bg: "bg-red-400" },
  ],
  hs: [
    { min: 55, text: "text-green-600 dark:text-green-400", bg: "bg-green-500" },
    { min: 45, text: "text-gray-700 dark:text-gray-300", bg: "bg-yellow-400" },
    { min: 35, text: "text-orange-500 dark:text-orange-400", bg: "bg-orange-400" },
    { min: -Infinity, text: "text-red-500 dark:text-red-400", bg: "bg-red-400" },
  ],
}

export function getStatColor(value: number, type: StatType): string {
  for (const tier of TIERS[type]) {
    if (value >= tier.min) return tier.text
  }
  return TIERS[type][TIERS[type].length - 1].text
}

export function getStatBgColor(value: number, type: StatType): string {
  for (const tier of TIERS[type]) {
    if (value >= tier.min) return tier.bg
  }
  return TIERS[type][TIERS[type].length - 1].bg
}
