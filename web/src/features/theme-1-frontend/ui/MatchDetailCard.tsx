import type { MatchRecord } from "@/types"

interface MatchDetailCardProps {
  record: MatchRecord
  mapName: string
}

export function MatchDetailCard({ record, mapName }: MatchDetailCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 my-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Секция 1: Изменение ELO */}
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-1">Изменение ELO</div>
          {/* TODO: Задание 1.2 — Отобразите изменение ELO после матча
           * Документация: https://react.dev/reference/react/useState
           *
           * Используйте record.eloChange для отображения:
           * - Положительное значение: "+25" зелёным цветом (text-green-600 dark:text-green-400)
           * - Отрицательное значение: "-15" красным цветом (text-red-500 dark:text-red-400)
           * - Если eloChange отсутствует: покажите "—"
           *
           * Подсказка: условный рендеринг
           * {record.eloChange !== undefined ? (
           *   <span className={record.eloChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
           *     {record.eloChange >= 0 ? "+" : ""}{record.eloChange}
           *   </span>
           * ) : <span>—</span>}
           */}
          <div className="text-lg font-bold text-gray-400">—</div>
        </div>

        {/* Секция 2: Сравнение K/D */}
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-1">K/D в матче</div>
          {/* TODO: Задание 1.2 — Отобразите K/D игрока
           * Документация: https://react.dev/reference/react/useState
           *
           * Используйте record.kills, record.deaths, record.assists, record.kdRatio
           * Формат: "22/15/4 (1.47)"
           *
           * Если статистика отсутствует (kills === undefined), покажите "—"
           *
           * Для цвета K/D используйте getStatColor из utils/colors.ts:
           * import { getStatColor } from "../../utils/colors"
           * className={getStatColor(record.kdRatio!, "kd")}
           *
           * Аналог: посмотрите как K/D отображается в MatchHistoryTab.tsx (строки с r.kills)
           */}
          <div className="text-lg font-bold text-gray-400">—</div>
        </div>

        {/* Секция 3: Ссылка на матч */}
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-1">Подробности</div>
          {/* TODO: Задание 1.2 — Добавьте ссылку на страницу матча на FACEIT
           * Документация: https://react.dev/reference/react/useState
           *
           * Используйте record.faceitUrl для создания внешней ссылки:
           * <a href={record.faceitUrl} target="_blank" rel="noopener noreferrer"
           *    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 text-sm">
           *   Открыть на FACEIT →
           * </a>
           *
           * Также добавьте информацию о карте и счёте:
           * <div className="text-sm text-gray-600 dark:text-gray-300">
           *   {mapName.replace("de_", "")} — {record.mapScore}
           * </div>
           */}
          <div className="text-sm text-gray-400">—</div>
        </div>

      </div>

      {/* BONUS: Задание 1.2 — Дополнительные метрики
       * Документация: https://react.dev/reference/react/useState
       *
       * Добавьте строку с ADR и HS% под основными секциями:
       * - ADR: record.adr с цветом getStatColor(record.adr, "adr")
       * - HS%: record.headshotPercent с цветом getStatColor(record.headshotPercent, "hs")
       *
       * Формат: горизонтальный flex с gap-6
       */}
    </div>
  )
}
