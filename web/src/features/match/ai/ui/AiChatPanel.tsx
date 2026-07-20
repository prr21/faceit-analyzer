import { useEffect, useRef, useState } from "react"
import { useMatchChat } from "../model/useMatchChat"
import type { MatchAnalysisResult } from "@/shared/types"

function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        }`}
      >
        {content || <span className="inline-block w-2 h-4 bg-current opacity-60 animate-pulse" />}
      </div>
    </div>
  )
}

export function AiChatPanel({
  matchId,
  result,
}: {
  matchId: string
  result: MatchAnalysisResult
}) {
  const { messages, isStreaming, error, send } = useMatchChat(matchId, result)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // автоскролл к последнему сообщению по мере стриминга (scrollTo нет в jsdom)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
    setInput("")
  }

  return (
    <div className="flex flex-col h-[70vh] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !error && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            Готовлю предматчевую выжимку…
          </p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {error && (
          <p className="text-sm text-red-500 text-center">
            {error}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 p-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isStreaming}
          placeholder={isStreaming ? "AI печатает…" : "Спросите про этот матч…"}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          Отправить
        </button>
      </form>
    </div>
  )
}
