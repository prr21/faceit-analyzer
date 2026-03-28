import "dotenv/config"
import express from "express"
import { corsMiddleware } from "./middleware/cors.js"
import { rateLimit } from "./middleware/rateLimit.js"
import { apiRouter } from "./routes/api.js"

const app = express()

// Парсинг JSON-тела запросов
app.use(express.json())

// CORS middleware (Задание 2.1)
app.use(corsMiddleware)

// Rate limiting (Задание 2.1)
app.use(rateLimit({ windowMs: 60_000, maxRequests: 100 }))

// API маршруты
app.use("/api", apiRouter)

// Проверка работоспособности
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// TODO: Задание 2.1 — Запустите сервер на порту из переменной окружения
//
// const PORT = parseInt(process.env.PORT || "3000", 10)
//
// app.listen(PORT, () => {
//   console.log(`Сервер запущен: http://localhost:${PORT}`)
//   console.log(`Health check: http://localhost:${PORT}/health`)
//   console.log(`API: http://localhost:${PORT}/api/search?q=nickname`)
//
//   if (!process.env.FACEIT_API_KEY) {
//     console.warn("⚠ FACEIT_API_KEY не задан в .env — API-запросы не будут работать")
//   }
// })
//
// Подсказки:
// - process.env.PORT — порт из переменной окружения (или 3000 по умолчанию)
// - parseInt() — преобразование строки в число
// - app.listen(port, callback) — запускает HTTP-сервер

console.log("Сервер не запущен — реализуйте TODO в index.ts")
