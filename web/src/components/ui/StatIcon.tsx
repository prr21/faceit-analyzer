interface StatIconProps {
  /** Тип статистики */
  type: "kd" | "adr" | "hs" | "winRate"
  /** Размер иконки в пикселях (по умолчанию 16) */
  size?: number
  /** Дополнительные CSS-классы */
  className?: string
}

export function StatIcon({ type, size = 16, className = "" }: StatIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block ${className}`}
    >
      {/* TODO: Задание 16.2 — Нарисуйте SVG-иконки для каждого типа статистики
       *
       * Используйте SVG-элементы <path>, <circle>, <line>, <polyline> для создания иконок.
       * stroke="currentColor" означает, что цвет линий будет наследоваться от текста —
       * это автоматически поддерживает тёмную и светлую тему.
       *
       * Варианты иконок (выберите или придумайте свои):
       *
       * {type === "kd" && (
       *   // Перекрестье (crosshair) — символ точности стрельбы
       *   <>
       *     <circle cx="12" cy="12" r="10" />
       *     <line x1="12" y1="2" x2="12" y2="6" />
       *     <line x1="12" y1="18" x2="12" y2="22" />
       *     <line x1="2" y1="12" x2="6" y2="12" />
       *     <line x1="18" y1="12" x2="22" y2="12" />
       *   </>
       * )}
       *
       * {type === "adr" && (
       *   // Взрыв / звезда — символ урона
       *   <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
       * )}
       *
       * {type === "hs" && (
       *   // Голова с точкой — символ хедшота
       *   <>
       *     <circle cx="12" cy="8" r="5" />
       *     <circle cx="12" cy="8" r="1" fill="currentColor" />
       *     <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
       *   </>
       * )}
       *
       * {type === "winRate" && (
       *   // Трофей — символ победы
       *   <>
       *     <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
       *     <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
       *     <path d="M6 3h12v6a6 6 0 0 1-12 0V3z" />
       *     <path d="M9 21h6" />
       *     <path d="M12 15v6" />
       *   </>
       * )}
       *
       * Ресурсы:
       * - SVG path синтаксис: M=moveTo, L=lineTo, C=curveTo, Z=closePath
       * - Lucide Icons (https://lucide.dev) — набор SVG-иконок, откуда можно взять path data
       * - Все координаты в viewBox 0 0 24 24 (24x24 пикселей)
       */}
    </svg>
  )

  // BONUS: Задание 16.2 — Анимированный вариант иконки
  //
  // Создайте проп animated?: boolean
  // Если animated === true, добавьте CSS-анимацию:
  // - kd: пульсация (scale 1 → 1.1 → 1)
  // - adr: вращение на 360°
  // - hs: мигание
  // - winRate: покачивание (rotate -5° → 5° → 0°)
  //
  // Используйте className с Tailwind: animate-pulse, animate-spin
  // Или создайте кастомные @keyframes в app.css
}
