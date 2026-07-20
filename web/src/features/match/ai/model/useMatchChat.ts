import { useCallback, useEffect, useRef, useState } from "react"
import { streamMatchChat } from "@/shared/api/endpoints"
import type { ChatMessage } from "@/shared/api/endpoints"
import type { MatchAnalysisResult } from "@/shared/types"

/**
 * Состояние AI-чата по матчу: авто-выжимка при первом открытии, отправка
 * вопросов, накопление стрим-токенов в последнем ответе ассистента.
 */
export function useMatchChat(matchId: string, result: MatchAnalysisResult) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(
    async (history: ChatMessage[], ac: AbortController) => {
      abortRef.current = ac
      setError(null)
      setIsStreaming(true)
      // пустой ответ ассистента, в который будем дописывать токены
      setMessages([...history, { role: "assistant", content: "" }])

      try {
        await streamMatchChat(
          matchId,
          result,
          history,
          token => {
            if (ac.signal.aborted) return
            setMessages(prev => {
              const copy = prev.slice()
              const last = copy[copy.length - 1]
              copy[copy.length - 1] = { ...last, content: last.content + token }
              return copy
            })
          },
          ac.signal,
        )
      } catch (e) {
        if (ac.signal.aborted) return
        setError(e instanceof Error ? e.message : "Ошибка AI")
        // убираем пустой/частичный ответ ассистента
        setMessages(prev => prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant" && m.content === "")))
      } finally {
        if (!ac.signal.aborted) setIsStreaming(false)
      }
    },
    [matchId, result],
  )

  // Авто-выжимка (пустой messages → сервер выдаёт сводку). StrictMode-safe:
  // каждый маунт запускает свой запрос и отменяет его на cleanup.
  useEffect(() => {
    const ac = new AbortController()
    void run([], ac)
    return () => ac.abort()
  }, [run])

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (isStreaming || !trimmed) return
      const history: ChatMessage[] = [...messages, { role: "user", content: trimmed }]
      void run(history, new AbortController())
    },
    [messages, isStreaming, run],
  )

  return { messages, isStreaming, error, send }
}
