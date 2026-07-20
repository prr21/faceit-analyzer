# Переход на официальный FACEIT Downloads API — дизайн

Дата: 2026-07-20
Статус: утверждён (brainstorming), ждёт implementation plan
Контекст: заявка на Downloads API одобрена FACEIT (письмо получено).
Продолжение [2026-07-19-voice-playback-design.md](2026-07-19-voice-playback-design.md) —
пункт «Официальный Downloads API (подключается позже)» из «Вне скоупа».

## Цель

Скачивание демок через официальный Downloads API вместо внутреннего
эндпоинта faceit.com с браузерным session-токеном. Один env-токен
(`FACEIT_API_KEY`), `FACEIT_SESSION_TOKEN` удаляется полностью.

## API-факты (docs.faceit.com/getting-started/Guides/download-api)

| | Внутренний (было) | Официальный (станет) |
|---|---|---|
| URL | `https://www.faceit.com/api/download/v2/demos/download-url` | `https://open.faceit.com/download/v2/demos/download` |
| Метод | POST | POST |
| Body | `{ "resource_url": "..." }` | то же |
| Ответ | `{ "payload": { "download_url": "<signed>" } }` | то же |
| Auth | Bearer session-токен браузера | Bearer server-side API key апрувнутого app (Downloads scope) |

Формы запроса/ответа идентичны — меняются только URL-константа и источник токена.

## Изменения

1. **`core/constants.ts`** — `FACEIT_DOWNLOAD_API_URL` →
   `https://open.faceit.com/download/v2/demos/download`.
2. **`core/voice/demo.ts`** — `fetchSignedDemoUrl(resourceUrl, apiKey, fetchFn?)`:
   переименование параметра `sessionToken` → `apiKey`, комментарий про
   официальный API. Логика без изменений.
3. **`core/usecases/voice.ts`** — `getFaceitSessionToken()` → `getFaceitApiKey()`;
   комментарий «скачивание по сессионному токену» → официальный Downloads API.
4. **`core/env.ts`** — удалить `getFaceitSessionToken`.
5. **`core/index.ts`** — удалить экспорт `getFaceitSessionToken`.
6. **Тесты** — `core/__tests__/env.test.ts`: убрать describe session-токена
   (если файл станет пустым — удалить или переориентировать на `getFaceitApiKey`);
   `core/__tests__/voice-demo.test.ts` проходит как есть (сигнатура не менялась).
7. **Ошибки** — hint при 401/403 от download-эндпоинта «обнови токен в .env» →
   «у FACEIT_API_KEY нет Downloads-scope / ключ не от апрувнутого приложения»
   (место, где живёт текст, найти при имплементации: server errorHandler
   или voice.service).
8. **Docs** — CLAUDE.md: секцию «Internal Download API» заменить на
   «Downloads API (официальный)», убрать все упоминания `FACEIT_SESSION_TOKEN`
   (включая инструкцию про DevTools). `.env`: пользователь сам удаляет
   переменную (упомянуть в итоговом выводе).

## Требование к окружению

`FACEIT_API_KEY` в корневом `.env` должен быть **server-side ключом
апрувнутого приложения**. Если заявка подавалась на другой app —
заменить значение ключа. Живой curl-тест (см. верификацию) покажет сразу.

## Верификация

1. `npm run typecheck`, юнит-тесты core.
2. Живой curl официального эндпоинта с ключом из `.env` и реальным
   `resource_url`. **Если 403 — не ретраить и не дебажить**: FACEIT мог ещё
   не до конца выдать доступ (одобрение свежее). Зафиксировать факт,
   код оставить как есть — форма запроса подтверждена докой.
3. При успешном curl — интеграционный прогон `npm run voice` на реальном матче.

## Вне скоупа

- Webhook `DEMO_READY` — требует публичного эндпоинта; тула работает
  on-demand по прошедшим матчам, событие «демка готова» не нужно.
- Fallback на session-токен — отвергнут (YAGNI, два пути, мёртвый код).
