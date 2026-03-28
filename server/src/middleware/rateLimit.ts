import type { Request, Response, NextFunction } from "express"

// TODO: Задание 2.1 — Реализуйте rate-limiting middleware
//
// Rate limiting — ограничение частоты запросов от одного клиента.
// Это защищает сервер от злоупотреблений и DDoS-атак.
//
// Алгоритм "скользящее окно" (sliding window):
// 1. Для каждого IP-адреса храним массив временных меток запросов
// 2. При новом запросе:
//    - Удаляем метки старше windowMs (например, 60 секунд)
//    - Если количество оставшихся меток >= maxRequests → отклоняем (429)
//    - Иначе → добавляем текущую метку и пропускаем запрос
//
// Реализация:
// const requestLog = new Map<string, number[]>()
//
// interface RateLimitOptions {
//   windowMs: number    // Окно в миллисекундах (например, 60_000 = 1 минута)
//   maxRequests: number // Максимум запросов за окно (например, 100)
// }
//
// export function rateLimit({ windowMs, maxRequests }: RateLimitOptions) {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const ip = req.ip || req.socket.remoteAddress || "unknown"
//     const now = Date.now()
//
//     // Получить или создать массив меток для этого IP
//     const timestamps = requestLog.get(ip) || []
//
//     // Отфильтровать старые метки (за пределами окна)
//     const recent = timestamps.filter(t => now - t < windowMs)
//
//     if (recent.length >= maxRequests) {
//       res.status(429).json({
//         error: "Too Many Requests",
//         message: `Превышен лимит: ${maxRequests} запросов за ${windowMs / 1000} секунд`,
//         retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000),
//       })
//       return
//     }
//
//     recent.push(now)
//     requestLog.set(ip, recent)
//     next()
//   }
// }
//
// Подсказки:
// - req.ip — IP-адрес клиента
// - HTTP 429 — стандартный код "Too Many Requests"
// - Map хранит данные в памяти (при перезапуске сервера счётчики сбрасываются)
// - В продакшене используют Redis или аналогичное хранилище

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

export function rateLimit(_options: RateLimitOptions) {
  // Заглушка: пропускает все запросы без ограничений
  return (_req: Request, _res: Response, next: NextFunction) => {
    next()
  }
}
