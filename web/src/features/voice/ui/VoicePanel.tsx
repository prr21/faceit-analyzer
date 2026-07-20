import type { VoicePlayerDto, VoiceProgressStep } from "@/shared/types"
import { useStartVoiceExtraction, useVoiceStatus } from "../model/useMatchVoices"

const STEP_LABELS: Record<VoiceProgressStep, string> = {
  download: "Скачивание демки...",
  extract: "Извлечение голосов...",
  transcode: "Конвертация в MP3...",
}

const btnClass =
  "cursor-pointer px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 " +
  "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"

function InlineSpinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
  )
}

function PlayerAudio({ player, highlight }: { player: VoicePlayerDto; highlight: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1.5">
      <span
        className={`text-sm w-full sm:w-40 truncate ${
          highlight ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"
        }`}
      >
        {player.nickname}{highlight ? " ⭐" : ""}
      </span>
      <audio controls preload="none" src={player.url} className="w-full sm:flex-1 h-8" />
    </div>
  )
}

interface VoicePanelProps {
  matchId: string
  /** Ник целевого игрока (страница игрока) — подсвечивается в списке */
  highlightNickname?: string
}

export function VoicePanel({ matchId, highlightNickname }: VoicePanelProps) {
  const { data, isLoading, error } = useVoiceStatus(matchId)
  const start = useStartVoiceExtraction(matchId)

  if (isLoading) {
    return (
      <div className="py-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <InlineSpinner /> <span>Проверка статуса...</span>
      </div>
    )
  }
  if (error) return <p className="py-3 text-sm text-red-500">Ошибка: {error.message}</p>

  const status = data?.status ?? "none"

  if (status === "none") {
    return (
      <div className="py-3">
        <button onClick={() => start.mutate()} disabled={start.isPending} className={btnClass}>
          🎤 Извлечь голоса из демки
        </button>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Скачает демку и достанет голосовой чат — займёт несколько минут
        </p>
      </div>
    )
  }

  if (status === "pending" || status === "extracting") {
    return (
      <div className="py-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <InlineSpinner />
        <span>{(data?.step && STEP_LABELS[data.step]) || "В очереди..."}</span>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="py-3">
        <p className="text-sm text-red-500 mb-2">{data?.error ?? "Ошибка извлечения"}</p>
        <button onClick={() => start.mutate()} className={btnClass}>Повторить</button>
      </div>
    )
  }

  const players = data?.players ?? []
  if (players.length === 0) {
    return (
      <p className="py-3 text-sm text-gray-500 dark:text-gray-400">
        😶 Голоса не найдены — в демке нет голосовых данных
      </p>
    )
  }

  const factions = [
    { key: "faction1" as const, label: "Команда 1" },
    { key: "faction2" as const, label: "Команда 2" },
  ]

  return (
    <div className="py-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
      {factions.map(({ key, label }) => {
        const list = players.filter(p => p.faction === key)
        if (list.length === 0) return null
        return (
          <div key={key}>
            <h4 className="text-[11px] uppercase text-gray-400 dark:text-gray-500 mb-1">{label}</h4>
            {list.map(p => (
              <PlayerAudio
                key={p.steamId64}
                player={p}
                highlight={!!highlightNickname && p.nickname.toLowerCase() === highlightNickname.toLowerCase()}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
