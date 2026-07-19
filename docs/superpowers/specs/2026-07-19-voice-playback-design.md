# Прослушивание голосов игроков из FACEIT-матчей — дизайн

Дата: 2026-07-19
Статус: утверждён (brainstorming), ждёт implementation plan

## Цель

Дать возможность послушать голосовую связь игрока из конкретного матча FACEIT:
в web-интерфейсе на странице игрока (`/player/:nickname`, таб «Матчи») и через
CLI-команду. Извлечение — через [csgo-voice-extractor](https://github.com/akiver/csgo-voice-extractor)
(бинарник `csgove`). Логика — в одном месте (`core/`), переиспользуется CLI,
сервером и будущим Telegram-ботом.

## Ключевые решения (утверждены)

| Вопрос | Решение | Почему |
|---|---|---|
| Получение .dem | Авто-скачивание по `FACEIT_SESSION_TOKEN` (внутренний эндпоинт faceit.com) + поддержка локального пути | Официальный Downloads API требует заявку (~30 дней); абстракция DemoProvider позволит подключить его позже |
| Чей голос | Все игроки за один прогон | Экстрактор парсит демку целиком в любом случае; повторный парсинг ради другого игрока — минуты CPU впустую |
| Режим экстрактора | `split-compact` (речь без тишины, файл на игрока) | Малые файлы, быстрая отдача; `split-full` (~100+ МБ WAV на игрока, 90% тишина) нужен только для синхронизации с таймлайном — не наш кейс |
| Формат хранения | MP3 mono 64 kbps через `ffmpeg-static`, WAV удаляются | ~10x меньше WAV, играет в любом браузере и в Telegram |
| Архитектура | Логика в `core/voice` + in-memory джобы на сервере | Один источник для CLI/server/бота; без Redis/очередей — локальный инструмент; миграция на очередь возможна позже |

## Архитектура

```
CLI:  cli/voice.ts ──────────────┐
Server: voice.service.ts ────────┼──► core/usecases/voice.ts (fetchMatchVoices)
TG-бот (будущее) ────────────────┘
```

### core/ (новое)

```
core/
  voice/
    binary.ts      # ensureExtractor() — авто-скачивание релиза csgove с GitHub
                   # при первом запуске → tools/csgove/ (gitignored); версия пином в constants.ts
    demo.ts        # получение .dem: demo_url → POST внутренний download-url
                   # эндпоинт faceit.com (Bearer = FACEIT_SESSION_TOKEN) → signed URL →
                   # скачивание → gunzip (встроенный zlib). Либо готовый локальный путь.
    extract.ts     # запуск csgove: -mode split-compact -output <dir>; за инъектируемым
                   # runner-интерфейсом (для тестов)
    transcode.ts   # WAV → MP3 (mono 64 kbps) через ffmpeg-static; тоже за runner
    manifest.ts    # маппинг steamId64 → FACEIT-игрок, сборка VoiceManifest
  usecases/
    voice.ts       # fetchMatchVoices(client, matchIdOrUrl, opts) — оркестрация:
                   # кеш-хит → манифест | демка → extract → transcode → манифест
  types/voice.ts   # VoiceManifest, VoicePlayerAudio, VoiceJobStatus
```

### Контракт

```ts
interface VoicePlayerAudio {
  playerId: string      // faceit id
  nickname: string
  steamId64: string
  faction: "faction1" | "faction2"
  filePath: string      // абсолютный путь к mp3
  fileSize: number
}

interface VoiceManifest {
  matchId: string
  extractedAt: number
  mode: "split-compact"
  players: VoicePlayerAudio[]   // только те, для кого экстрактор создал файл
}
```

`fetchMatchVoices` принимает `opts`: `{ demoPath?, keepDemo?, onProgress?(step) }`,
где `step: "download" | "extract" | "transcode"`.

### Маппинг SteamID → игрок

WAV-файлы названы steamId64. Ростер берём из `getMatchInfo`, для каждого игрока
`GET /players/{id}` → поле `steam_id_64`. SteamID неизменен → кешируем ключом
`steamid:{playerId}` (правило «player info не кешируем из-за ELO» не нарушается —
кешируется только steam id).

Изменения типов: `FaceitPlayer` + `steam_id_64?: string`;
`FaceitMatchDetail` + `demo_url?: string[]`.

### Изменения в существующем коде

- `core/constants.ts`: версия csgove, URL релиза, битрейт MP3.
- `core/env.ts`: `getFaceitSessionToken()` — lazy, бросает только при вызове
  (паттерн `getFaceitApiKey`). Токен в едином корневом `.env`.
- `core/index.ts`: экспорт нового usecase и типов.
- `.gitignore`: `tools/`.

### Новые зависимости

`ffmpeg-static` (бинарник ffmpeg через npm), `extract-zip` (распаковка релиза
csgove). Опциональная нативная зависимость: opus-DLL идёт внутри релиза csgove.

### Проверяется при имплементации

Точный путь внутреннего download-url эндпоинта faceit.com (смотрим в DevTools
на кнопке «Download demo» в match room) и точные имена ассетов релиза csgove
(zip для windows/linux/darwin). Оба значения — константы, на архитектуру не влияют.

## CLI (`cli/voice.ts`)

```
npm run voice -- <matchId | faceit-match-url> [nickname] [--demo <path>] [--keep-demo]
```

- Прогресс по шагам в консоль (стиль существующих скриптов, вывод на русском).
- Результат: таблица (ник, команда, размер файла) + абсолютные пути к MP3
  в `.cache/voices/{matchId}/`.
- `nickname` — подсветка целевого игрока в выводе (опционально).
- `--demo` — пропустить скачивание, взять локальный .dem.
- Root `package.json`: script `voice`.
- Telegram-бот в будущем вызывает `fetchMatchVoices` напрямую и шлёт файлы из манифеста.

## Server

```
server/src/
  services/voice.service.ts  # in-memory Map<matchId, Job>
                             # Job: { status: pending|extracting|done|error,
                             #        step?: download|extract|transcode,
                             #        manifest?, error? }
                             # Дедуп: повторный POST на тот же матч возвращает
                             # существующую джобу; кеш-хит → сразу done
  routes/voice.routes.ts     # POST /api/match/:matchId/voices            — старт джобы
                             # GET  /api/match/:matchId/voices            — статус + манифест
                             # GET  /api/match/:matchId/voices/:steamId.mp3 — файл
                             #      (Content-Type: audio/mpeg, Accept-Ranges для перемотки)
```

- Роутер фабричный (`createVoiceRouter(ctx)`), ошибки через `AppError`,
  как в существующих роутерах.
- Джобы в памяти теряются при рестарте — приемлемо: готовые MP3 в кеше,
  повторный POST дешёвый.
- Отдача mp3: валидация `steamId` (только цифры) — защита от path traversal.
- Токен живёт только в `.env` сервера, в браузер не попадает.

## Web

```
web/src/features/voice/
  model/useMatchVoices.ts    # TanStack Query: мутация POST + поллинг GET
                             # (refetchInterval, пока pending/extracting)
  ui/VoicePanel.tsx          # кнопка «🎤 Голоса» → прогресс по шагам →
                             # плееры <audio controls> по командам,
                             # целевой игрок подсвечен
shared/api/endpoints.ts      # + startVoiceExtraction(matchId), getVoiceStatus(matchId)
```

- Точка входа: строка матча в `MatchList` (таб «Матчи») получает
  кнопку-раскрывашку; под строкой рендерится `VoicePanel`.
- Композиция `features/report` → `features/voice` разрешена импорт-правилами
  (report и pages компонуют другие фичи).
- `<audio src>` указывает прямо на `/api/match/{id}/voices/{steamId}.mp3`.
- Обязательно: dark mode + mobile responsive (плееры в столбик на мобиле).

## Диск и кеширование

```
.cache/voices/{matchId}/
  manifest.json          # VoiceManifest (пути относительные, абсолютизируются при чтении)
  {steamId}.mp3
.cache/voice-demos/      # временные .dem — удаляются после экстракции
tools/csgove/            # бинарник экстрактора (gitignored, качается один раз)
```

- Голоса матча immutable → кеш вечный без TTL (как match/voting/matchstats).
  Повторный запрос = чтение manifest.json: ноль API-вызовов, ноль парсинга.
- Демка (100–500 МБ) удаляется после успешной экстракции (`--keep-demo` отменяет).
  WAV удаляются после конвертации.
- Атомарность: экстракция в `{matchId}.tmp/` → `rename` в `{matchId}/` при успехе.
  Упавшая джоба не оставляет полукеша.
- Манифест — файлом рядом с mp3 (не через MD5-`FileSystemCache`): папка
  самодостаточна, сервер читает её напрямую.

## Ошибки

| Случай | Поведение |
|---|---|
| Матч без `demo_url` (FACEIT хранит демки ограниченно) | 404 `DEMO_NOT_AVAILABLE`; UI: «демка недоступна» |
| Нет `FACEIT_SESSION_TOKEN` | Ошибка конфигурации: CLI — понятный текст, API — 500 `CONFIG` |
| Токен протух (401/403 от faceit.com) | 502 `UPSTREAM_AUTH` + hint «обнови токен в .env» |
| Никто не говорил / нет голосовых данных | НЕ ошибка: пустой манифест; UI: «голоса не найдены» |
| Экстрактор / ffmpeg упал | Джоба → `status: error` + message; tmp-папка удаляется |

Сервисы не глотают ошибки блэнкет-catch'ем (правило проекта): специфичные
статусы мапятся на `AppError`, остальное летит в `errorHandler`.

## Тестирование

- **core (юнит)**: runner-интерфейс инъектируется → тесты `usecases/voice.ts`
  без бинарника: маппинг steamId→игрок, кеш-хит (экстрактор не вызывается),
  пустой манифест, парсинг matchId из faceit-URL, атомарный rename.
- **web (vitest, существующий сетап)**: состояния `VoicePanel` —
  кнопка / прогресс / плееры / «голоса не найдены» / ошибка.
- **Интеграция**: ручной прогон CLI с реальной демкой (не в CI).

## Вне скоупа

- Официальный Downloads API (подключается позже через DemoProvider).
- Telegram-бот (использует готовый usecase).
- Синхронизация с таймлайном матча (`split-full`), транскрипция, диаризация.
- Очередь джоб (Redis/BullMQ) — при необходимости позже.
