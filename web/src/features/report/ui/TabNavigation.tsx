import { NavLink } from "react-router-dom"
import type { TabDef } from "../model/tabs"

interface TabNavigationProps {
  tabs: TabDef[]
  basePath: string
  mode?: string // передаётся как query param ?mode=
}

export function TabNavigation({ tabs, basePath, mode }: TabNavigationProps) {
  const modeParam = mode ? `?mode=${mode}` : ""

  return (
    <div className="flex gap-0 border-b-2 border-gray-200 dark:border-gray-700 mt-5">
      {tabs.map(({ slug, label }) => (
        <NavLink
          key={slug}
          to={`${basePath}/${slug}${modeParam}`}
          className={({ isActive }) =>
            `px-3 sm:px-5 py-2 sm:py-2.5 no-underline cursor-pointer text-xs sm:text-sm font-medium transition-all -mb-0.5 border-b-2 ${
              isActive
                ? "text-gray-800 dark:text-gray-100 border-b-blue-500"
                : "text-gray-400 dark:text-gray-500 border-b-transparent hover:text-gray-600 dark:hover:text-gray-300"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}
