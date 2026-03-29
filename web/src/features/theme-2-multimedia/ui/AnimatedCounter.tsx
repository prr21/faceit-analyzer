import { useState, useEffect, useRef } from "react"

interface AnimatedCounterProps {
  /** Целевое значение */
  value: number
  /** Длительность анимации в миллисекундах (по умолчанию 1000) */
  duration?: number
  /** Суффикс после числа (например, "%" или "ms") */
  suffix?: string
  /** Количество знаков после запятой */
  decimals?: number
  /** CSS-класс для стилизации */
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1000,
  suffix = "",
  decimals = 0,
  className = "",
}: AnimatedCounterProps) {
  // Текущее отображаемое значение (начинает с 0, анимируется до value)
  const [displayValue, setDisplayValue] = useState(0)
  // Ссылка на ID requestAnimationFrame для отмены при размонтировании
  const rafRef = useRef<number | null>(null)
  // Ссылка на время начала анимации
  const startTimeRef = useRef<number | null>(null)

  // TODO: Задание 2.1 — Реализуйте анимацию счётчика через requestAnimationFrame
  // Документация: https://developer.mozilla.org/en-US/docs/Web/CSS/animation, https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  //
  // Алгоритм:
  // 1. В useEffect при изменении value запускаем анимацию
  // 2. Функция animate(currentTime):
  //    - Если startTimeRef.current === null → запомнить текущее время
  //    - Вычислить прогресс: elapsed / duration (от 0 до 1)
  //    - Ограничить прогресс: Math.min(progress, 1)
  //    - Вычислить текущее значение: progress * value
  //    - Обновить displayValue через setDisplayValue
  //    - Если progress < 1 → запросить следующий кадр: requestAnimationFrame(animate)
  //
  // Код:
  // useEffect(() => {
  //   startTimeRef.current = null
  //
  //   function animate(currentTime: number) {
  //     if (startTimeRef.current === null) {
  //       startTimeRef.current = currentTime
  //     }
  //     const elapsed = currentTime - startTimeRef.current
  //     const progress = Math.min(elapsed / duration, 1)
  //
  //     // Easing-функция для плавности (ease-out):
  //     const eased = 1 - Math.pow(1 - progress, 3)
  //
  //     setDisplayValue(eased * value)
  //
  //     if (progress < 1) {
  //       rafRef.current = requestAnimationFrame(animate)
  //     }
  //   }
  //
  //   rafRef.current = requestAnimationFrame(animate)
  //
  //   // Cleanup: отменить анимацию при размонтировании или изменении value
  //   return () => {
  //     if (rafRef.current !== null) {
  //       cancelAnimationFrame(rafRef.current)
  //     }
  //   }
  // }, [value, duration])
  //
  // Подсказка: requestAnimationFrame вызывает функцию перед следующей перерисовкой браузера (~60fps).
  // Это эффективнее, чем setInterval, потому что синхронизирован с рендерингом браузера.
  // cancelAnimationFrame в cleanup предотвращает утечку памяти при размонтировании компонента.

  // Форматирование числа
  const formatted = displayValue.toFixed(decimals)

  return (
    <span className={className}>
      {formatted}{suffix}
    </span>
  )
}
