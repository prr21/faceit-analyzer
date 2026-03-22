// Границы ELO для skill levels на FACEIT CS2
const SKILL_LEVELS = [
  { level: 1, min: 100, max: 500 },
  { level: 2, min: 501, max: 750 },
  { level: 3, min: 751, max: 900 },
  { level: 4, min: 901, max: 1050 },
  { level: 5, min: 1051, max: 1200 },
  { level: 6, min: 1201, max: 1350 },
  { level: 7, min: 1351, max: 1530 },
  { level: 8, min: 1531, max: 1750 },
  { level: 9, min: 1751, max: 2000 },
  { level: 10, min: 2001, max: 5000 },
]

const LEVEL_COLORS = [
  "bg-gray-400",      // 1
  "bg-green-700",     // 2
  "bg-green-600",     // 3
  "bg-green-500",     // 4
  "bg-yellow-500",    // 5
  "bg-yellow-400",    // 6
  "bg-orange-400",    // 7
  "bg-orange-500",    // 8
  "bg-orange-600",    // 9
  "bg-red-500",       // 10
]

interface SkillLevelBarProps {
  currentElo: number
  skillLevel: number
}

export function SkillLevelBar({ currentElo, skillLevel }: SkillLevelBarProps) {
  const currentLevelInfo = SKILL_LEVELS.find(l => l.level === skillLevel) ?? SKILL_LEVELS[9]
  const nextLevel = SKILL_LEVELS.find(l => l.level === skillLevel + 1)
  const eloToNext = nextLevel ? nextLevel.min - currentElo : null

  return (
    <div className="my-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${LEVEL_COLORS[skillLevel - 1] ?? "bg-gray-500"}`}>
            {skillLevel}
          </div>
          <div>
            <span className="text-2xl font-bold">{currentElo}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">ELO</span>
          </div>
        </div>
        {eloToNext !== null && eloToNext > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
            До уровня {skillLevel + 1}: <span className="font-semibold text-gray-700 dark:text-gray-300">{eloToNext}</span>
          </div>
        )}
      </div>

      {/* Шкала уровней */}
      <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
        {SKILL_LEVELS.map(({ level }) => {
          const isCurrent = level === skillLevel
          const isPast = level < skillLevel
          return (
            <div
              key={level}
              className={`flex-1 transition-all ${
                isPast || isCurrent ? LEVEL_COLORS[level - 1] : "bg-gray-200 dark:bg-gray-700"
              } ${isCurrent ? "ring-2 ring-white dark:ring-gray-300 ring-offset-1 ring-offset-transparent" : ""}`}
              title={`Уровень ${level}: ${SKILL_LEVELS[level - 1].min}–${SKILL_LEVELS[level - 1].max}`}
            />
          )
        })}
      </div>

      {/* Подписи уровней */}
      <div className="flex gap-0.5 mt-1">
        {SKILL_LEVELS.map(({ level, min }) => (
          <div key={level} className="flex-1 text-center">
            <span className={`text-[10px] ${level === skillLevel ? "font-bold text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-600"}`}>
              {level}
            </span>
          </div>
        ))}
      </div>

      {/* Прогресс внутри текущего уровня */}
      {skillLevel < 10 && (
        <div className="mt-2">
          <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">
            <span>{currentLevelInfo.min}</span>
            <span>{currentLevelInfo.max}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${LEVEL_COLORS[skillLevel - 1]}`}
              style={{ width: `${Math.min(100, ((currentElo - currentLevelInfo.min) / (currentLevelInfo.max - currentLevelInfo.min)) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
