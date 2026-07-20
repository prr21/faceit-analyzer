import { getAiConfig } from "../env"

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface StreamChatOptions {
  system: string
  messages: ChatMessage[]
  onToken: (token: string) => void
  signal?: AbortSignal
}

/**
 * Разбирает одну SSE-строку OpenAI-совместимого стрима в дельта-токен.
 * Возвращает null для служебных строк ([DONE], не-data, битый JSON).
 * Чистая — тестируется без сети.
 */
export function extractSseDelta(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith("data:")) return null
  const payload = trimmed.slice(5).trim()
  if (payload === "" || payload === "[DONE]") return null
  try {
    const json = JSON.parse(payload)
    const content = json?.choices?.[0]?.delta?.content
    return typeof content === "string" && content.length > 0 ? content : null
  } catch {
    return null
  }
}

/**
 * Стриминг chat-completion с OpenAI-совместимого провайдера (Groq по умолч.).
 * Токены отдаются через onToken по мере поступления. Серверная функция —
 * web в рантайме её не импортирует.
 */
export async function streamChatCompletion(options: StreamChatOptions): Promise<void> {
  const { apiKey, baseUrl, model } = getAiConfig()
  const { system, messages, onToken, signal } = options

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "")
    const error = new Error(
      `AI-провайдер вернул ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
    ) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Обрабатываем завершённые строки, последнюю (возможно неполную) оставляем в буфере
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const token = extractSseDelta(line)
      if (token) onToken(token)
    }
  }

  const tail = extractSseDelta(buffer)
  if (tail) onToken(tail)
}
