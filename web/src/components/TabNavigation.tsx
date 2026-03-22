interface TabNavigationProps {
  tabs: string[]
  activeTab: number
  onTabChange: (index: number) => void
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-0 border-b-2 border-gray-200 mt-5">
      {tabs.map((name, i) => (
        <button
          key={name}
          className={`px-5 py-2.5 border-none bg-transparent cursor-pointer text-sm font-medium transition-all -mb-0.5 border-b-2 ${
            i === activeTab
              ? "text-gray-800 border-b-blue-500"
              : "text-gray-400 border-b-transparent hover:text-gray-600"
          }`}
          onClick={() => onTabChange(i)}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
