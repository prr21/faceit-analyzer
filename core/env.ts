import "dotenv/config"

export function getFaceitApiKey(): string {
  const key = process.env.FACEIT_API_KEY
  if (!key) throw new Error("FACEIT_API_KEY is not set in .env")
  return key
}

export interface AiConfig {
  apiKey: string
  baseUrl: string // OpenAI-совместимый endpoint (по умолчанию Groq)
  model: string
}

/**
 * Конфиг AI-провайдера. Ленивый — бросает только при вызове, так что web/CLI
 * без ключа продолжают работать. Провайдер меняется через env (OpenAI-совместимый):
 * Groq (по умолч.), OpenRouter, Gemini-compat.
 */
export function getAiConfig(): AiConfig {
  const apiKey = process.env.AI_API_KEY
  if (!apiKey) throw new Error("AI_API_KEY is not set in .env")
  return {
    apiKey,
    baseUrl: process.env.AI_BASE_URL ?? "https://api.groq.com/openai/v1",
    model: process.env.AI_MODEL ?? "llama-3.3-70b-versatile",
  }
}
