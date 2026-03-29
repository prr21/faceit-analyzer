# FACEIT Proxy Server

REST API proxy-сервер, который проксирует запросы к FACEIT API и скрывает API-ключ от браузера.

## Установка и запуск

```bash
npm install

# Настройте API-ключ (файл .env в корне проекта)
cp ../.env.example ../.env
# Впишите FACEIT_API_KEY в .env

# Запуск в режиме разработки (с hot reload)
npm run dev          # http://localhost:3000
```

## Задание 3.1 — Express-сервер

4 файла, 7 TODO-маркеров:

| Файл | Что реализовать |
|------|----------------|
| `src/middleware/cors.ts` | CORS-заголовки + обработка preflight (OPTIONS) |
| `src/middleware/rateLimit.ts` | Sliding window rate limiting по IP |
| `src/routes/api.ts` | 3 эндпоинта + error handler middleware |
| `src/index.ts` | Запуск сервера (`app.listen`) |

Подробная теория и документация: [docs/themes/theme-3-rest-api.md](../docs/themes/theme-3-rest-api.md)

## API-эндпоинты

После реализации сервер предоставляет:

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/health` | Health check (уже работает) |
| GET | `/api/search?q=<nickname>` | Поиск игрока по никнейму |
| GET | `/api/player/:nickname` | Статистика игрока |
| GET | `/api/reports` | Список сгенерированных HTML-отчётов |

## Проверка

```bash
# Запустите сервер
npm run dev

# В другом терминале
curl http://localhost:3000/health
# → {"status":"ok"}
```

## Полезные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск с hot reload |
| `npm start` | Запуск без hot reload |
| `npm run typecheck` | Проверка TypeScript-типов |
