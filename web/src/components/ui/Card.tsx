import type { ReactNode } from "react"

interface CardProps {
  title: string
  value: string | number
  valueColor?: "green" | "red"
  subtitle?: string
  children?: ReactNode
}

export function Card({ title, value, valueColor, subtitle, children }: CardProps) {
  const colorClass = valueColor === "green" ? "text-green-600" : valueColor === "red" ? "text-red-600" : ""

  return (
    <div className="flex-1 min-w-[100px] sm:min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1.5 sm:mb-2">{title}</div>
      <div className={`text-xl sm:text-[28px] font-bold ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</div>}
      {children}
    </div>
  )
}
