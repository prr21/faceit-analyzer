import { Router } from "express"
import type { Request, Response } from "express"

const router = Router()

// Базовый URL внешнего API
const FACEIT_API_BASE = "https://open.faceit.com/data/v4"

// TODO: Задание 2.1 — Реализуйте эндпоинт поиска игроков
//
// GET /api/search?q=nickname
//
// Что нужно сделать:
// 1. Получить параметр q из query string: req.query.q
// 2. Проверить, что q — строка длиной >= 3 символа. Если нет → 400 Bad Request
// 3. Отправить запрос к FACEIT API:
//    GET https://open.faceit.com/data/v4/search/players?nickname=...&game=cs2&limit=5
//    Заголовок: Authorization: Bearer ${process.env.FACEIT_API_KEY}
// 4. Вернуть результат клиенту в формате JSON
// 5. Обработать ошибки: если FACEIT API вернул ошибку → передать клиенту с соответствующим кодом
//
// Пример реализации:
// router.get("/search", async (req: Request, res: Response) => {
//   const query = req.query.q
//   if (typeof query !== "string" || query.length < 3) {
//     res.status(400).json({ error: "Параметр q должен быть строкой длиной >= 3" })
//     return
//   }
//
//   try {
//     const response = await fetch(
//       `${FACEIT_API_BASE}/search/players?nickname=${encodeURIComponent(query)}&game=cs2&limit=5`,
//       { headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` } }
//     )
//
//     if (!response.ok) {
//       res.status(response.status).json({ error: `FACEIT API error: ${response.statusText}` })
//       return
//     }
//
//     const data = await response.json()
//     res.json(data)
//   } catch (error) {
//     res.status(500).json({ error: "Ошибка при запросе к FACEIT API" })
//   }
// })
//
// Подсказки:
// - encodeURIComponent() — экранирует спецсимволы в URL
// - process.env.FACEIT_API_KEY — API-ключ загружается из .env файла
// - fetch() — встроенная функция для HTTP-запросов (Node.js 18+)
router.get("/search", async (_req: Request, res: Response) => {
  res.status(501).json({ error: "Не реализовано — см. TODO в routes/api.ts" })
})

// TODO: Задание 2.1 — Реализуйте эндпоинт получения статистики игрока
//
// GET /api/player/:nickname
//
// Что нужно сделать:
// 1. Получить nickname из параметров маршрута: req.params.nickname
// 2. Сначала найти player_id по нику:
//    GET https://open.faceit.com/data/v4/players?nickname=...&game=cs2
// 3. Затем получить статистику по player_id:
//    GET https://open.faceit.com/data/v4/players/{player_id}/stats/cs2
// 4. Объединить данные и вернуть клиенту
// 5. Если игрок не найден → 404. Если ошибка сервера → 500.
//
// Подсказки:
// - Это последовательные запросы: сначала ищем ID, потом запрашиваем статистику
// - Используйте async/await для читаемости
// - Проверяйте response.ok после каждого fetch()
router.get("/player/:nickname", async (_req: Request, res: Response) => {
  res.status(501).json({ error: "Не реализовано — см. TODO в routes/api.ts" })
})

// TODO: Задание 2.1 — Реализуйте эндпоинт списка отчётов
//
// GET /api/reports
//
// Что нужно сделать:
// 1. Прочитать директорию output/reports/ (используя fs/promises)
// 2. Вернуть список HTML-файлов с метаданными:
//    [{ name: "PlayerName", file: "PlayerName.html", size: 12345, modified: "2024-03-10" }]
// 3. Если директория не существует → вернуть пустой массив
//
// Подсказки:
// - import { readdir, stat } from "fs/promises"
// - import { join } from "path"
// - const reportsDir = join(process.cwd(), "..", "output", "reports")
// - Фильтруйте только .html файлы
router.get("/reports", async (_req: Request, res: Response) => {
  res.status(501).json({ error: "Не реализовано — см. TODO в routes/api.ts" })
})

// TODO: Задание 2.1 — Добавьте middleware для обработки ошибок
//
// Express error-handling middleware имеет 4 параметра: (err, req, res, next)
// Он ловит все необработанные ошибки из маршрутов.
//
// router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
//   console.error("Ошибка сервера:", err.message)
//   res.status(500).json({
//     error: "Internal Server Error",
//     message: process.env.NODE_ENV === "development" ? err.message : "Внутренняя ошибка сервера",
//   })
// })
//
// Подсказка: import type { NextFunction } from "express"

export { router as apiRouter }
