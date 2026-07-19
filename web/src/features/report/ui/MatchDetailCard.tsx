import type { MatchRecord } from "@/shared/types"
import { getStatColor } from "@/shared/lib/colors"

interface MatchDetailCardProps {
  record: MatchRecord
  mapName: string
}

export function MatchDetailCard({ record, mapName }: MatchDetailCardProps) {
  const hasExtras = record.adr !== undefined || record.headshotPercent !== undefined

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 my-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-1">Изменение ELO</div>
          {record.eloChange !== undefined ? (
            <div
              className={`text-lg font-bold ${
                record.eloChange >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {record.eloChange >= 0 ? "+" : ""}{record.eloChange}
            </div>
          ) : (
            <div className="text-lg font-bold text-gray-400">—</div>
          )}
        </div>

        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-1">K/D в матче</div>
          {record.kills !== undefined ? (
            <div className={`text-lg font-bold ${record.kdRatio !== undefined ? getStatColor(record.kdRatio, "kd") : ""}`}>
              {record.kills}/{record.deaths}/{record.assists}
              {record.kdRatio !== undefined && (
                <span className="ml-2 text-sm font-normal">({record.kdRatio})</span>
              )}
            </div>
          ) : (
            <div className="text-lg font-bold text-gray-400">—</div>
          )}
        </div>

        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-1">Подробности</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {mapName.replace("de_", "")} — {record.mapScore}
          </div>
          {record.faceitUrl && (
            <a
              href={record.faceitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 text-sm"
            >
              Открыть на FACEIT →
            </a>
          )}
        </div>

      </div>

      {hasExtras && (
        <div className="flex gap-6 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          {record.adr !== undefined && (
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-1">ADR</div>
              <div className={`text-base font-semibold ${getStatColor(record.adr, "adr")}`}>
                {record.adr}
              </div>
            </div>
          )}
          {record.headshotPercent !== undefined && (
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase mb-1">HS%</div>
              <div className={`text-base font-semibold ${getStatColor(record.headshotPercent, "hs")}`}>
                {record.headshotPercent}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
