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
    <div className="flex-1 min-w-[140px] bg-white border border-gray-200 rounded-lg p-4 text-center">
      <div className="text-xs text-gray-500 uppercase mb-2">{title}</div>
      <div className={`text-[28px] font-bold ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
      {children}
    </div>
  )
}
