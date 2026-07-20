import { buildMatchAIContext, getAiConfig } from "@faceit/core"
import type { ChatMessage, MatchAnalysisResult } from "@faceit/core"
import { AppError } from "../lib/errors"

const SCOPE_RULES = [
  "Ты — аналитик пре-матч разведки для FACEIT CS2.",
  "Отвечай ТОЛЬКО на основе данных этого матча, приведённых ниже (эло, винрейты, карты, ростеры, рекомендации).",
  "Не выдумывай статистику, которой нет в данных. Если данных не хватает — прямо скажи об этом.",
  "Если вопрос не про этот матч или команды — вежливо откажись и напомни, что помогаешь только по этой встрече.",
  "Отвечай по-русски, кратко и по делу, языком киберспортивного аналитика.",
].join(" ")

/** Первый запрос без сообщений → просим модель выдать предматчевую выжимку. */
export const SUMMARY_SEED: ChatMessage = {
  role: "user",
  content:
    "Сделай краткую предматчевую выжимку по обеим командам: форма по эло/винрейту, сильные и слабые карты, и итоговые рекомендации по пикам и банам.",
}

export function buildMatchChatSystemPrompt(result: MatchAnalysisResult): string {
  return `${SCOPE_RULES}\n\nДАННЫЕ МАТЧА:\n${buildMatchAIContext(result)}`
}

/** Пустой список сообщений → синтетический запрос выжинки. */
export function resolveChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.length > 0 ? messages : [SUMMARY_SEED]
}

/** Быстрый префлайт до отправки SSE-заголовков: понятная JSON-ошибка при отсутствии ключа. */
export function assertAiConfigured(): void {
  try {
    getAiConfig()
  } catch {
    throw AppError.internal("AI-провайдер не настроен: задайте AI_API_KEY в .env")
  }
}

interface ChatRequestBody {
  result?: unknown
  messages?: unknown
}

export function validateChatRequest(body: ChatRequestBody): {
  result: MatchAnalysisResult
  messages: ChatMessage[]
} {
  const { result, messages } = body

  if (
    typeof result !== "object" ||
    result === null ||
    !Array.isArray((result as MatchAnalysisResult).teams) ||
    (result as MatchAnalysisResult).teams.length !== 2
  ) {
    throw AppError.badRequest("Тело должно содержать result матча с двумя командами")
  }

  if (!Array.isArray(messages)) {
    throw AppError.badRequest("messages должен быть массивом")
  }

  for (const m of messages as ChatMessage[]) {
    const okRole = m?.role === "user" || m?.role === "assistant"
    if (!okRole || typeof m?.content !== "string") {
      throw AppError.badRequest("Каждое сообщение — { role: 'user'|'assistant', content: string }")
    }
  }

  return { result: result as MatchAnalysisResult, messages: messages as ChatMessage[] }
}
