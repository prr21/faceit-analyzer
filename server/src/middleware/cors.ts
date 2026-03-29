import type { Request, Response, NextFunction } from "express"

// TODO: Задание 3.1 — Реализуйте CORS middleware
// Документация: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
//
// CORS (Cross-Origin Resource Sharing) — механизм безопасности браузера.
// Когда фронтенд (http://localhost:5173) делает запрос к серверу (http://localhost:3000),
// браузер блокирует запрос, если сервер не разрешил это явно.
//
// Что нужно сделать:
// 1. Установить заголовки ответа:
//    - Access-Control-Allow-Origin: разрешённый домен (или "*" для всех)
//    - Access-Control-Allow-Methods: "GET, POST, OPTIONS"
//    - Access-Control-Allow-Headers: "Content-Type, Authorization"
//
// 2. Обработать preflight-запрос (метод OPTIONS):
//    Браузер отправляет OPTIONS-запрос перед основным запросом.
//    Если метод — OPTIONS, ответить 204 (No Content) и завершить.
//    Иначе — вызвать next() для передачи управления следующему middleware.
//
// Реализация:
// export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
//   const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173"
//
//   res.setHeader("Access-Control-Allow-Origin", allowedOrigin)
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
//
//   if (req.method === "OPTIONS") {
//     res.status(204).end()
//     return
//   }
//
//   next()
// }
//
// Альтернатива: можно использовать npm-пакет cors (уже в зависимостях):
// import cors from "cors"
// app.use(cors({ origin: "http://localhost:5173" }))
//
// Подсказка: зачем писать свой middleware, если есть пакет cors?
// Чтобы понять, как работает CORS на уровне HTTP-заголовков.

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Заглушка: пропускает все запросы без CORS-заголовков
  next()
}
