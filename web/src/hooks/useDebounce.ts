import { useState, useEffect } from "react"

/**
 * Хук для debounce значения — задерживает обновление на указанное время.
 * Полезно для поиска: запрос отправляется не при каждом нажатии клавиши,
 * а после паузы в вводе.
 *
 * @param value - значение для debounce
 * @param delay - задержка в миллисекундах
 * @returns значение, обновлённое с задержкой
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  // TODO: Задание 4.2 — Реализуйте debounce через useEffect
  // Документация: https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
  //
  // Алгоритм:
  // 1. При каждом изменении value запускаем таймер на delay миллисекунд
  // 2. Когда таймер срабатывает — обновляем debouncedValue
  // 3. Если value изменилось раньше, чем таймер сработал — отменяем старый таймер
  //
  // Реализация:
  // useEffect(() => {
  //   // Запускаем таймер
  //   const timer = setTimeout(() => {
  //     setDebouncedValue(value)
  //   }, delay)
  //
  //   // Cleanup: отменяем таймер если value изменилось раньше
  //   return () => clearTimeout(timer)
  // }, [value, delay])
  //
  // Как это работает:
  // - Пользователь набирает "abc": a → ab → abc
  // - При каждом символе создаётся новый таймер, старый отменяется
  // - Только после паузы (delay мс) значение обновляется
  // - Результат: один запрос с "abc" вместо трёх запросов (a, ab, abc)
  //
  // Аналог: useTheme.ts использует такой же паттерн useEffect + cleanup

  return debouncedValue
}
