import { useState, useRef, useCallback } from "react"

interface UsePollingResult<T> {
  /** Последние загруженные данные */
  data: T | null
  /** Timestamp последнего успешного обновления */
  lastUpdated: number | null
  /** Идёт ли сейчас обновление */
  isRefreshing: boolean
  /** Функция для ручного обновления */
  refresh: () => void
  /** Ключи, которые изменились при последнем обновлении */
  changedKeys: string[]
}

interface UsePollingOptions<T> {
  /** Функция загрузки данных */
  fetchFn: () => Promise<T>
  /** Интервал опроса в миллисекундах */
  interval: number
  /** Включён ли polling */
  enabled?: boolean
}

/**
 * Хук для периодического опроса (polling) с отслеживанием изменений.
 */
export function usePolling<T extends Record<string, unknown>>(
  options: UsePollingOptions<T>
): UsePollingResult<T> {
  const { fetchFn, interval, enabled = true } = options

  const [data, setData] = useState<T | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [changedKeys, setChangedKeys] = useState<string[]>([])

  // Ref для хранения предыдущих данных (для сравнения)
  const prevDataRef = useRef<T | null>(null)
  // Ref для ID интервала (для cleanup)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Используем void для подавления TS-ошибок неиспользуемых переменных
  void fetchFn
  void interval
  void enabled

  // TODO: Задание 5.2 — Реализуйте функцию загрузки данных
  // Документация: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
  //
  // const doFetch = useCallback(async () => {
  //   setIsRefreshing(true)
  //   try {
  //     const newData = await fetchFn()
  //
  //     // Сравниваем с предыдущими данными, чтобы найти изменения
  //     if (prevDataRef.current) {
  //       const changed: string[] = []
  //       for (const key of Object.keys(newData)) {
  //         if (JSON.stringify(newData[key]) !== JSON.stringify(prevDataRef.current[key])) {
  //           changed.push(key)
  //         }
  //       }
  //       setChangedKeys(changed)
  //
  //       // Через 2 секунды сбрасываем подсветку изменений
  //       if (changed.length > 0) {
  //         setTimeout(() => setChangedKeys([]), 2000)
  //       }
  //     }
  //
  //     prevDataRef.current = newData
  //     setData(newData)
  //     setLastUpdated(Date.now())
  //   } catch (err) {
  //     console.error("Polling error:", err)
  //   } finally {
  //     setIsRefreshing(false)
  //   }
  // }, [fetchFn])

  // TODO: Задание 5.2 — Запустите интервал через useEffect
  // Документация: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
  //
  // useEffect(() => {
  //   if (!enabled) return
  //
  //   // Первая загрузка сразу
  //   doFetch()
  //
  //   // Запускаем интервал
  //   intervalRef.current = setInterval(doFetch, interval)
  //
  //   // Cleanup: очищаем интервал при размонтировании или изменении параметров
  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current)
  //     }
  //   }
  // }, [doFetch, interval, enabled])
  //
  // Ключевые концепции:
  //
  // 1. setInterval — выполняет callback каждые N миллисекунд.
  //    clearInterval — останавливает интервал.
  //    ОБЯЗАТЕЛЬНО очищайте интервал в cleanup useEffect!
  //    Иначе при размонтировании компонента интервал продолжит работать (утечка).
  //
  // 2. useCallback(doFetch, [fetchFn]) — мемоизирует функцию, чтобы она не
  //    пересоздавалась при каждом рендере. Это важно для зависимостей useEffect.
  //
  // 3. useRef(prevDataRef) — хранит предыдущие данные МЕЖДУ рендерами.
  //    В отличие от useState, изменение ref НЕ вызывает перерендер.
  //    Используем для сравнения old/new данных.
  //
  // 4. changedKeys — массив ключей, значения которых изменились.
  //    Компоненты могут использовать его для подсветки (CSS-класс highlight-changed).
  //
  // Аналог: useTheme.ts для паттерна useEffect с cleanup

  // Подавляем предупреждения о неиспользуемых refs
  void prevDataRef
  void intervalRef
  void setData
  void setLastUpdated
  void setIsRefreshing
  void setChangedKeys

  const refresh = useCallback(() => {
    // TODO: Задание 5.2 — Вызовите doFetch() для ручного обновления
    // Документация: https://developer.mozilla.org/en-US/docs/Web/API/setInterval
    // doFetch()
  }, [])

  return { data, lastUpdated, isRefreshing, refresh, changedKeys }
}
