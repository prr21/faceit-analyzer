# @faceit/server

Express proxy-сервер для FACEIT API. Скрывает API-ключ от браузера, предоставляет аналитические эндпоинты через `@faceit/core`.

## Запуск

```bash
npm install
cp ../.env.example ../.env       # вписать FACEIT_API_KEY
npm run dev                      # http://localhost:3000 (с hot reload)
npm start                        # без hot reload
```

## Архитектура

Layered: Routes → Services → Core. Детали — в [CLAUDE.md](../CLAUDE.md#server-faceitserver).

```
src/
  index.ts                # Express app, middleware chain, mount routes
  bootstrap.ts            # Composition Root: FaceitClient init
  lib/errors.ts           # AppError (badRequest, notFound, internal)
  services/               # Оркестрация core/usecases + AppError boundary
  routes/                 # Factory routers (createXxxRouter(ctx))
  middleware/             # CORS, rate limit, errorHandler
```

## Эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| GET  | `/health` | Health check |
| GET  | `/api/search?q=<nickname>` | Поиск игроков (FACEIT Search API) |
| GET  | `/api/player/:nickname/analysis` | Полный анализ игрока |
| POST | `/api/team/analysis` | Анализ команды (body: `{ playerIds, teamName }`) |

## Проверка

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/search?q=dErzz"
curl http://localhost:3000/api/player/dErzz/analysis
```
