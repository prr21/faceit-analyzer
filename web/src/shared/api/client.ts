export const API_BASE = import.meta.env.VITE_API_URL ?? ""

/**
 * Базовый fetch-wrapper для API-запросов.
 * Автоматически парсит JSON. При HTTP-ошибке достаёт сообщение
 * из тела ответа сервера ({ error, code }), иначе — generic-текст.
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
    let message =
      response.status === 404
        ? "Не найдено"
        : `Ошибка сервера: ${response.status}`
    try {
      const body = (await response.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // тело не JSON — оставляем generic-сообщение
    }
    throw new Error(message)
  }

  return response.json()
}
