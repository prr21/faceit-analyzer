import { useState } from "react"

interface MapImageProps {
  /** Название карты (например, "de_dust2") */
  mapName: string
  /** Размер изображения в пикселях (по умолчанию 32) */
  size?: number
}

// Цвета для fallback-иконок (первая буква карты в цветном круге)
const FALLBACK_COLORS: Record<string, string> = {
  d: "bg-amber-500",   // dust2
  m: "bg-blue-500",    // mirage
  i: "bg-red-500",     // inferno
  n: "bg-green-500",   // nuke
  a: "bg-purple-500",  // ancient, anubis
  v: "bg-cyan-500",    // vertigo
  o: "bg-pink-500",    // overpass
  t: "bg-orange-500",  // train
}

export function MapImage({ mapName, size = 32 }: MapImageProps) {
  // TODO: Задание 2.2 — Добавьте состояние для отслеживания ошибки загрузки
  // Документация: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial
  //
  // const [hasError, setHasError] = useState(false)
  //
  // Когда изображение не удаётся загрузить (onError), устанавливаем hasError = true
  // и показываем fallback вместо <img>

  const shortName = mapName.replace("de_", "")
  const firstLetter = shortName.charAt(0).toLowerCase()
  const bgColor = FALLBACK_COLORS[firstLetter] || "bg-gray-500"

  // TODO: Задание 2.2 — Реализуйте условный рендеринг: изображение или fallback
  // Документация: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial
  //
  // if (!hasError) {
  //   return (
  //     <img
  //       src={`/maps/${mapName}.jpg`}
  //       alt={shortName}
  //       width={size}
  //       height={size}
  //       loading="lazy"
  //       className="rounded object-cover"
  //       onError={() => setHasError(true)}
  //     />
  //   )
  // }
  //
  // Подсказки:
  // - loading="lazy" — браузер загружает изображение только когда оно приближается к viewport
  // - onError — событие вызывается если изображение не найдено (404) или повреждено
  // - object-cover — изображение заполняет контейнер без искажения пропорций

  // Fallback: цветной круг с первой буквой
  return (
    <div
      className={`${bgColor} rounded flex items-center justify-center text-white font-bold text-xs`}
      style={{ width: size, height: size }}
    >
      {shortName.charAt(0).toUpperCase()}
    </div>
  )
}
