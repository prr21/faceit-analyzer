import { useState } from "react"
import type { ReportData } from "@/types"
import { CompareView } from "../ui/CompareView"
import { LoadingSpinner } from "@/components/core/LoadingSpinner"
import { ErrorMessage } from "@/components/core/ErrorMessage"

export function CompareTab({ isDark }: { isDark: boolean }) {
  const [nickname1, setNickname1] = useState("")
  const [nickname2, setNickname2] = useState("")
  const [data1, setData1] = useState<ReportData | null>(null)
  const [data2, setData2] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TODO: Задание 5.1 — Реализуйте функцию сравнения двух игроков
  // Документация: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
  //
  // async function handleCompare() {
  //   if (nickname1.length < 2 || nickname2.length < 2) {
  //     setError("Введите никнеймы обоих игроков (минимум 2 символа)")
  //     return
  //   }
  //
  //   setLoading(true)
  //   setError(null)
  //   setData1(null)
  //   setData2(null)
  //
  //   try {
  //     // Promise.allSettled — выполняет ОБА запроса, даже если один из них упал
  //     // В отличие от Promise.all, который останавливается при первой ошибке
  //     const [result1, result2] = await Promise.allSettled([
  //       fetch(`/api/player/${encodeURIComponent(nickname1)}`).then(r => {
  //         if (!r.ok) throw new Error(`Игрок "${nickname1}" не найден`)
  //         return r.json() as Promise<ReportData>
  //       }),
  //       fetch(`/api/player/${encodeURIComponent(nickname2)}`).then(r => {
  //         if (!r.ok) throw new Error(`Игрок "${nickname2}" не найден`)
  //         return r.json() as Promise<ReportData>
  //       }),
  //     ])
  //
  //     // Обработка частичных ошибок
  //     if (result1.status === "fulfilled") setData1(result1.value)
  //     if (result2.status === "fulfilled") setData2(result2.value)
  //
  //     // Формируем сообщение об ошибке, если хотя бы один запрос не удался
  //     const errors: string[] = []
  //     if (result1.status === "rejected") errors.push(result1.reason.message)
  //     if (result2.status === "rejected") errors.push(result2.reason.message)
  //
  //     if (errors.length > 0) {
  //       setError(errors.join("; "))
  //     }
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : "Неизвестная ошибка")
  //   } finally {
  //     setLoading(false)
  //   }
  // }
  //
  // Ключевые концепции:
  //
  // 1. Promise.allSettled vs Promise.all:
  //    - Promise.all: если ЛЮБОЙ промис отклонён → всё отклоняется
  //    - Promise.allSettled: ВСЕГДА ждёт завершения всех, каждый результат — {status, value/reason}
  //    Мы используем allSettled, чтобы показать данные найденного игрока,
  //    даже если второй не найден.
  //
  // 2. Параллельные запросы:
  //    Оба fetch выполняются одновременно, а не последовательно.
  //    Это быстрее: 2 запроса по 200мс = 200мс параллельно, 400мс последовательно.

  // Подавляем предупреждения линтера для переменных, которые студенты подключат в TODO
  void data1
  void data2
  void setData1
  void setData2
  void setLoading
  void setError
  void isDark

  return (
    <div className="py-5">
      <h2 className="text-lg font-semibold mb-4">Сравнение игроков</h2>

      {/* Форма ввода */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={nickname1}
          onChange={e => setNickname1(e.target.value)}
          placeholder="Никнейм игрока 1"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400"
        />
        <span className="text-gray-400 text-center self-center">vs</span>
        <input
          type="text"
          value={nickname2}
          onChange={e => setNickname2(e.target.value)}
          placeholder="Никнейм игрока 2"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400"
        />
        <button
          // TODO: Задание 5.1 — Подключите handleCompare
          // Документация: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
          // onClick={handleCompare}
          disabled={loading}
          className="cursor-pointer px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Загрузка..." : "Сравнить"}
        </button>
      </div>

      {/* Состояния */}
      {loading && <LoadingSpinner message="Загрузка данных игроков..." />}
      {error && <ErrorMessage message={error} />}

      {/* TODO: Задание 5.1 — Отобразите CompareView когда оба игрока загружены
       * Документация: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
       *
       * {data1 && data2 && <CompareView player1={data1} player2={data2} />}
       *
       * Также обработайте частичный результат (один загружен, другой нет):
       * {(data1 || data2) && !(data1 && data2) && (
       *   <p className="text-sm text-gray-400">Загружен только один игрок из двух</p>
       * )}
       */}
    </div>
  )
}
