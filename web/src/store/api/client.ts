// Переключение mock/real API
// По умолчанию идём на реальный сервер (через vite proxy /api → server).
// Мок включается явным VITE_USE_MOCK=true в .env.
export const IS_MOCK = import.meta.env.VITE_USE_MOCK === "true"
const API_BASE = import.meta.env.VITE_API_URL ?? ""

/**
 * Базовый fetch-wrapper для API-запросов.
 * Автоматически парсит JSON, обрабатывает HTTP-ошибки.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!response.ok) {
    const message =
      response.status === 404
        ? "Не найдено"
        : `Ошибка сервера: ${response.status}`
    throw new Error(message)
  }

  return response.json()
}
