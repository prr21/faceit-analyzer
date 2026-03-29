import type { ReportData } from "../../../types"

interface CompareViewProps {
  player1: ReportData
  player2: ReportData
}

export function CompareView({ player1, player2 }: CompareViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
      {/* TODO: Задание 5.1 — Отобразите сравнение двух игроков
       * Документация: https://react.dev/reference/react
       *
       * Для каждого игрока (player1, player2) вычислите и покажите:
       * 1. Никнейм и аватар (из stats.playerProfile, если есть)
       * 2. Текущий ELO (stats.playerProfile?.currentElo)
       * 3. Общий винрейт (вычислить из stats.mapWinRate)
       * 4. Средний K/D (вычислить из stats.matchRecords)
       * 5. Средний ADR (вычислить из stats.matchRecords)
       * 6. Лучшая карта (карта с лучшим винрейтом)
       *
       * Для каждой метрики подсветите лучшего игрока:
       * - Если значение player1 > player2 → player1 зелёным, player2 красным
       * - Если равны → оба серым
       *
       * Структура:
       * <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
       *   <div className="text-center mb-4">
       *     <h3 className="font-bold text-lg">{player1.name}</h3>
       *   </div>
       *   <div className="space-y-3">
       *     <MetricRow label="ELO" value={elo1} isBetter={elo1 > elo2} />
       *     <MetricRow label="Win Rate" value={`${wr1}%`} isBetter={wr1 > wr2} />
       *     ...
       *   </div>
       * </div>
       *
       * Подсказки:
       * - Вычисление винрейта: суммируйте wins/losses из Object.values(stats.mapWinRate)
       * - Вычисление K/D: соберите все записи из Object.values(stats.matchRecords).flat()
       * - Аналог: посмотрите SummaryCards.tsx для паттерна вычисления общего винрейта
       */}

      {/* Временная заглушка */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
        <h3 className="font-bold text-lg mb-2">{player1.name}</h3>
        <p className="text-sm text-gray-400">Реализуйте отображение метрик (см. TODO)</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
        <h3 className="font-bold text-lg mb-2">{player2.name}</h3>
        <p className="text-sm text-gray-400">Реализуйте отображение метрик (см. TODO)</p>
      </div>
    </div>
  )
}
