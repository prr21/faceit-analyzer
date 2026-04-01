// Переключение mock/real API
// В DEV без VITE_API_URL используем мок-данные
export const IS_MOCK = import.meta.env.DEV && !import.meta.env.VITE_API_URL
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
