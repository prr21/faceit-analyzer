interface RefreshIndicatorProps {
  /** Timestamp последнего обновления (Date.now()) */
  lastUpdated: number | null
  /** Интервал обновления в миллисекундах */
  interval: number
  /** Идёт ли сейчас обновление */
  isRefreshing: boolean
  /** Callback для ручного обновления */
  onRefresh: () => void
}

export function RefreshIndicator({
  lastUpdated,
  interval,
  isRefreshing,
  onRefresh,
}: RefreshIndicatorProps) {
  // TODO: Задание 14.2 — Вычислите прогресс до следующего обновления
  //
  // Алгоритм:
  // 1. Текущее время: Date.now()
  // 2. Время с последнего обновления: now - lastUpdated
  // 3. Прогресс: (elapsed / interval) * 100, ограниченный 0-100
  // 4. Секунд назад: Math.floor(elapsed / 1000)
  //
  // Реализация:
  // const [now, setNow] = useState(Date.now())
  //
  // // Обновляем "now" каждую секунду для актуального отображения
  // useEffect(() => {
  //   const timer = setInterval(() => setNow(Date.now()), 1000)
  //   return () => clearInterval(timer)
  // }, [])
  //
  // const elapsed = lastUpdated ? now - lastUpdated : 0
  // const progress = Math.min((elapsed / interval) * 100, 100)
  // const secondsAgo = Math.floor(elapsed / 1000)
  //
  // Подсказка: нужны импорты useState, useEffect из "react"

  // Подавляем TS-ошибки неиспользуемых параметров
  void lastUpdated
  void interval

  return (
    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 my-2">
      {/* Прогресс-бар до следующего обновления */}
      <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[200px]">
        {/* TODO: Задание 14.2 — Заполните прогресс-бар
         *
         * <div
         *   className="h-full bg-blue-500 rounded-full transition-all duration-1000"
         *   style={{ width: `${progress}%` }}
         * />
         */}
      </div>

      {/* Текст "обновлено X сек назад" */}
      {/* TODO: Задание 14.2 — Покажите время с последнего обновления
       *
       * {lastUpdated ? (
       *   <span>Обновлено {secondsAgo} сек назад</span>
       * ) : (
       *   <span>Ожидание первого обновления...</span>
       * )}
       */}
      <span>—</span>

      {/* Кнопка ручного обновления */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="cursor-pointer px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {isRefreshing ? "Обновление..." : "Обновить"}
      </button>
    </div>
  )
}
