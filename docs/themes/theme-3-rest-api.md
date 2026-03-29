# Тема 3 — REST API сервер

## Теория

### REST (Representational State Transfer)

REST — архитектурный стиль проектирования API. Основные принципы:

- **Ресурсы** — каждый URL представляет сущность: `/api/player/nickname`, `/api/reports`
- **HTTP-методы** — GET (получить), POST (создать), PUT (обновить), DELETE (удалить)
- **Коды ответов** — 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error)
- **Stateless** — сервер не хранит состояние между запросами; каждый запрос самодостаточен

### Express.js

Express — минималистичный фреймворк для создания HTTP-серверов на Node.js. Ключевые концепции:

- **Маршруты (Routes)** — привязка обработчиков к URL-шаблонам: `router.get('/api/search', handler)`
- **Middleware** — функции, выполняющиеся до обработчика маршрута. Принимают `(req, res, next)` и могут модифицировать запрос/ответ или прервать цепочку
- **Цепочка middleware** — запрос проходит через несколько функций последовательно: CORS → Rate Limit → Route Handler

```ts
app.use(corsMiddleware)    // 1. Проверка CORS
app.use(rateLimitMiddleware) // 2. Проверка лимита
app.use('/api', apiRouter)   // 3. Обработка маршрута
app.use(errorHandler)        // 4. Обработка ошибок
```

### CORS (Cross-Origin Resource Sharing)

Когда фронтенд (`localhost:5173`) делает запрос к серверу (`localhost:3000`), браузер блокирует ответ, если сервер не отправил заголовки CORS. Middleware должен устанавливать:
- `Access-Control-Allow-Origin` — разрешённый домен
- `Access-Control-Allow-Methods` — разрешённые методы
- `Access-Control-Allow-Headers` — разрешённые заголовки

### Rate Limiting

Ограничение частоты запросов защищает сервер от перегрузки. Простейший алгоритм — **скользящее окно (sliding window)**: хранить Map с IP-адресами и временами запросов, отклонять запрос (429 Too Many Requests), если превышен лимит.

## Документация

- [Express.js: Getting Started](https://expressjs.com/en/starter/hello-world.html)
- [Express.js: Routing](https://expressjs.com/en/guide/routing.html)
- [Express.js: Writing Middleware](https://expressjs.com/en/guide/writing-middleware.html)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN: HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

## Задание

### Задание 3.1 — Express-сервер

**Файлы:**
- `server/src/index.ts` — точка входа, подключение middleware
- `server/src/routes/api.ts` — маршруты API (3 эндпоинта)
- `server/src/middleware/cors.ts` — CORS middleware
- `server/src/middleware/rateLimit.ts` — Rate limiting middleware

**TODO:** 7 маркеров

**Что нужно сделать:**
1. `cors.ts` — установить CORS-заголовки и обработать preflight-запрос (OPTIONS)
2. `rateLimit.ts` — реализовать sliding window алгоритм с Map для хранения запросов по IP
3. `api.ts` — реализовать 3 обработчика:
   - `GET /api/search?q=<nickname>` — поиск игрока через FACEIT API
   - `GET /api/player/:nickname` — получение статистики игрока
   - `GET /api/reports` — список сгенерированных HTML-отчётов
4. `api.ts` — добавить middleware обработки ошибок
5. `index.ts` — запустить сервер (`app.listen`)

**Проверка:**
```bash
cd server && npm run dev
# В другом терминале:
curl http://localhost:3000/health        # → {"status":"ok"}
curl http://localhost:3000/api/search?q=s1mple  # → данные игрока
```
