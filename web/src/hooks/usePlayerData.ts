import { useState, useEffect } from "react"
import type { ReportData } from "../types"

interface UsePlayerDataResult {
  /** Загруженные данные (null пока загружаются или при ошибке) */
  data: ReportData | null
  /** Флаг загрузки */
  loading: boolean
  /** Текст ошибки (null если нет ошибки) */
  error: string | null
  /** Функция для повторной загрузки */
  refetch: () => void
}

/**
 * Хук для загрузки данных игрока с сервера.
 *
 * @param nickname - никнейм игрока для загрузки
 * @returns объект с data, loading, error и refetch
 */
export function usePlayerData(nickname: string): UsePlayerDataResult {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Счётчик для принудительной перезагрузки
  const [fetchCount, setFetchCount] = useState(0)

  function refetch() {
    setFetchCount(c => c + 1)
  }

  // TODO: Задание 4.1 — Реализуйте загрузку данных через useEffect
  // Документация: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API, https://developer.mozilla.org/en-US/docs/Web/API/AbortController
  //
  // Алгоритм:
  // 1. Если nickname пустой — не загружать (ранний return)
  // 2. Установить loading = true, error = null
  // 3. Создать AbortController для отмены запроса
  // 4. Выполнить fetch к API серверу
  // 5. Обработать результат или ошибку
  // 6. В cleanup-функции вызвать controller.abort()
  //
  // Реализация:
  // useEffect(() => {
  //   if (!nickname) return
  //
  //   const controller = new AbortController()
  //   setLoading(true)
  //   setError(null)
  //
  //   async function loadData() {
  //     try {
  //       const response = await fetch(
  //         `/api/player/${encodeURIComponent(nickname)}`,
  //         { signal: controller.signal }
  //       )
  //
  //       if (!response.ok) {
  //         throw new Error(
  //           response.status === 404
  //             ? `Игрок "${nickname}" не найден`
  //             : `Ошибка сервера: ${response.status}`
  //         )
  //       }
  //
  //       const result: ReportData = await response.json()
  //       setData(result)
  //     } catch (err) {
  //       // AbortError — запрос отменён (при размонтировании), не нужно обновлять состояние
  //       if (err instanceof DOMException && err.name === "AbortError") return
  //       setError(err instanceof Error ? err.message : "Неизвестная ошибка")
  //     } finally {
  //       setLoading(false)
  //     }
  //   }
  //
  //   loadData()
  //
  //   // Cleanup: отменить запрос если компонент размонтирован или nickname изменился
  //   return () => controller.abort()
  // }, [nickname, fetchCount])
  //
  // Ключевые концепции:
  //
  // 1. AbortController — позволяет отменить HTTP-запрос.
  //    Если пользователь уходит со страницы во время загрузки, запрос отменяется.
  //    Без этого — утечка памяти (setState на размонтированном компоненте).
  //
  // 2. signal: controller.signal — передаётся в fetch() для привязки к AbortController.
  //    При вызове controller.abort() fetch выбрасывает AbortError.
  //
  // 3. Зависимости [nickname, fetchCount]:
  //    - nickname — перезагрузка при смене игрока
  //    - fetchCount — перезагрузка при вызове refetch()
  //
  // 4. Паттерн loading/error/data:
  //    - Начало загрузки: loading=true, error=null
  //    - Успех: data=result, loading=false
  //    - Ошибка: error=message, loading=false
  //    - Это стандартный паттерн для асинхронных данных в React
  //
  // Аналог: посмотрите useTheme.ts для примера useEffect с cleanup

  return { data, loading, error, refetch }
}
