interface ModeToggleProps {
  mode: "leader" | "all"
  onModeChange: (mode: "leader" | "all") => void
}

const MODES = [
  { key: "leader" as const, label: "Как лидер" },
  { key: "all" as const, label: "Все матчи" },
]

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex justify-center my-4">
      <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              mode === key
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => onModeChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
