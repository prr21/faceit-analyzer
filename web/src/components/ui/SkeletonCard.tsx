interface SkeletonCardProps {
  /** Вариант размера: "sm" (маленький), "md" (средний), "lg" (большой) */
  variant?: "sm" | "md" | "lg"
}

const sizes = {
  sm: "h-16",
  md: "h-24",
  lg: "h-36",
}

export function SkeletonCard({ variant = "md" }: SkeletonCardProps) {
  return (
    <div
      className={`
        flex-1 min-w-[100px] sm:min-w-[140px]
        bg-gray-200 dark:bg-gray-700
        rounded-lg ${sizes[variant]}
      `}
    >
      {/* TODO: Задание 16.1 — Примените shimmer-анимацию
       *
       * Сейчас скелетон — просто серый блок. Нужно добавить анимацию "мерцания":
       *
       * 1. Добавьте класс "animate-shimmer" к внешнему <div>:
       *    className={`... animate-shimmer`}
       *
       * 2. Добавьте внутренние "полоски" для имитации текста:
       *    <div className="p-3 sm:p-4 space-y-2">
       *      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
       *      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
       *      {variant !== "sm" && (
       *        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
       *      )}
       *    </div>
       *
       * CSS-класс animate-shimmer определён в app.css.
       * Он создаёт эффект бегущего блика через linear-gradient + animation.
       *
       * Аналог: посмотрите структуру Card.tsx — скелетон имитирует такую же форму.
       */}
    </div>
  )
}
