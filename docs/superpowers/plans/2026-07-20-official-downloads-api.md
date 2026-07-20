# Официальный FACEIT Downloads API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Скачивание демок через официальный FACEIT Downloads API (`open.faceit.com`) с обычным `FACEIT_API_KEY`; полное удаление `FACEIT_SESSION_TOKEN` и внутреннего эндпоинта.

**Architecture:** Формы запроса/ответа официального API идентичны внутреннему (`POST {resource_url}` → `{payload:{download_url}}`), поэтому меняются только URL-константа и источник Bearer-токена. Старый путь удаляется без fallback (решение спека).

**Tech Stack:** TypeScript, vitest, fetch (нативный), npm workspaces.

Спек: `docs/superpowers/specs/2026-07-20-official-downloads-api-design.md`

## Global Constraints

- Официальный эндпоинт: `POST https://open.faceit.com/download/v2/demos/download`, Bearer = `FACEIT_API_KEY` (server-side ключ одобренного приложения).
- `FACEIT_SESSION_TOKEN` удаляется полностью — без fallback.
- Комментарии и вывод в консоль — на русском (конвенция проекта).
- Верификация live-curl: **при 403 не ретраить и не дебажить** — FACEIT мог ещё не полностью выдать доступ; зафиксировать факт и остановиться.
- Тесты core: `npm run test -w @faceit/core`. Typecheck: `npm run typecheck`.

---

### Task 1: Официальный эндпоинт и API-ключ в core

**Files:**
- Modify: `core/constants.ts:21-22`
- Modify: `core/voice/demo.ts:15-28`
- Modify: `core/usecases/voice.ts:6,96,109`
- Test: `core/__tests__/voice-demo.test.ts:30-42`
- Test: `core/__tests__/voice-usecase.test.ts:87`

**Interfaces:**
- Consumes: существующие `FACEIT_DOWNLOAD_API_URL` (`core/constants.ts`), `getFaceitApiKey()` (`core/env.ts`), `withRetry` (`core/infra/retry`).
- Produces: `fetchSignedDemoUrl(resourceUrl: string, apiKey: string, fetchFn?: typeof fetch): Promise<string>` — сигнатура позиционно совместима, переименован второй параметр; `FACEIT_DOWNLOAD_API_URL === "https://open.faceit.com/download/v2/demos/download"`. Task 2 удаляет `getFaceitSessionToken` — после этой задачи её больше никто не вызывает.

- [ ] **Step 1: Failing-тест — эндпоинт официальный**

В `core/__tests__/voice-demo.test.ts` первый тест `fetchSignedDemoUrl` дополнить проверкой URL (тест уже захватывает `captured.url`):

```ts
  it("возвращает payload.download_url и шлёт Bearer", async () => {
    let captured: any
    const fetchFn = (async (url: any, init: any) => {
      captured = { url, init }
      return new Response(JSON.stringify({ payload: { download_url: "https://signed/x" } }))
    }) as typeof fetch

    const url = await fetchSignedDemoUrl("https://demos.faceit.com/x.dem.gz", "tok", fetchFn)
    expect(url).toBe("https://signed/x")
    expect(captured.url).toBe("https://open.faceit.com/download/v2/demos/download")
    expect(captured.init.method).toBe("POST")
    expect(captured.init.headers.Authorization).toBe("Bearer tok")
    expect(JSON.parse(captured.init.body)).toEqual({ resource_url: "https://demos.faceit.com/x.dem.gz" })
  })
```

- [ ] **Step 2: Прогнать — убедиться, что падает**

Run: `npm run test -w @faceit/core -- voice-demo`
Expected: FAIL — `captured.url` равен `https://www.faceit.com/api/download/v2/demos/download-url`.

- [ ] **Step 3: Константа + переименование параметра + usecase**

`core/constants.ts` — заменить значение:

```ts
export const FACEIT_DOWNLOAD_API_URL =
  "https://open.faceit.com/download/v2/demos/download"
```

`core/voice/demo.ts` — комментарий и параметр (тело без изменений):

```ts
/** Обмен resource_url на подписанный download_url (официальный Downloads API) */
export async function fetchSignedDemoUrl(
  resourceUrl: string,
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  return withRetry(async () => {
    const response = await fetchFn(FACEIT_DOWNLOAD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ resource_url: resourceUrl }),
    })
    if (!response.ok) {
      const err: any = new Error(`HTTP ${response.status} при получении download_url`)
      err.status = response.status
      throw err
    }
    const data = await response.json()
    const url = data?.payload?.download_url
    if (!url) throw new Error("Ответ download-url эндпоинта без payload.download_url")
    return url
  })
}
```

`core/usecases/voice.ts` — три правки:

Строка 6, импорт:

```ts
import { getFaceitApiKey } from "../env"
```

Строка 96, комментарий:

```ts
  // Демка: локальный файл или скачивание через официальный Downloads API
```

Строки 109–110:

```ts
    const apiKey = getFaceitApiKey()
    const signedUrl = await deps.fetchSignedDemoUrl(resourceUrl, apiKey)
```

`core/__tests__/voice-usecase.test.ts` строка 87 — env-переменная в beforeEach:

```ts
    process.env.FACEIT_API_KEY = "tok"
```

- [ ] **Step 4: Прогнать тесты core**

Run: `npm run test -w @faceit/core`
Expected: PASS (все).

- [ ] **Step 5: Commit**

```bash
git add core/constants.ts core/voice/demo.ts core/usecases/voice.ts core/__tests__/voice-demo.test.ts core/__tests__/voice-usecase.test.ts
git commit -m "feat(core): скачивание демок через официальный FACEIT Downloads API"
```

---

### Task 2: Удаление getFaceitSessionToken

**Files:**
- Modify: `core/env.ts:9-17` (удалить функцию)
- Modify: `core/index.ts:70` (убрать из экспорта)
- Test: `core/__tests__/env.test.ts` (переориентировать на `getFaceitApiKey`)

**Interfaces:**
- Consumes: после Task 1 `getFaceitSessionToken` не имеет вызовов в коде.
- Produces: `core/env.ts` экспортирует только `getFaceitApiKey(): string`; `core/index.ts:70` → `export { getFaceitApiKey } from "./env"`.

- [ ] **Step 1: Переписать env.test.ts на getFaceitApiKey**

Полное новое содержимое `core/__tests__/env.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest"
import { getFaceitApiKey } from "../env"

describe("getFaceitApiKey", () => {
  const saved = process.env.FACEIT_API_KEY
  afterEach(() => {
    if (saved === undefined) delete process.env.FACEIT_API_KEY
    else process.env.FACEIT_API_KEY = saved
  })

  it("возвращает ключ, когда задан", () => {
    process.env.FACEIT_API_KEY = "test-key"
    expect(getFaceitApiKey()).toBe("test-key")
  })

  it("бросает понятную ошибку без ключа", () => {
    delete process.env.FACEIT_API_KEY
    expect(() => getFaceitApiKey()).toThrow("FACEIT_API_KEY")
  })
})
```

- [ ] **Step 2: Прогнать — тест зелёный ещё до удаления**

Run: `npm run test -w @faceit/core -- env`
Expected: PASS (`getFaceitApiKey` уже существует — это refactor-delete, а не новая фича).

- [ ] **Step 3: Удалить функцию и экспорт**

`core/env.ts` — итоговое содержимое файла целиком:

```ts
import "dotenv/config"

export function getFaceitApiKey(): string {
  const key = process.env.FACEIT_API_KEY
  if (!key) throw new Error("FACEIT_API_KEY is not set in .env")
  return key
}
```

`core/index.ts` строка 70:

```ts
export { getFaceitApiKey } from "./env"
```

- [ ] **Step 4: Тесты + typecheck**

Run: `npm run test -w @faceit/core`
Expected: PASS.

Run: `npm run typecheck`
Expected: без ошибок во всех workspace (упавший импорт `getFaceitSessionToken` где-то ещё — признак пропущенного вызова; grep `getFaceitSessionToken` должен давать 0 совпадений вне `docs/`).

- [ ] **Step 5: Commit**

```bash
git add core/env.ts core/index.ts core/__tests__/env.test.ts
git commit -m "refactor(core): удалить getFaceitSessionToken — session-токен больше не нужен"
```

---

### Task 3: Server-сообщения и CLAUDE.md

**Files:**
- Modify: `server/src/services/voice.service.ts:87-88`
- Modify: `server/src/index.ts:48-50`
- Modify: `CLAUDE.md:226-234` (секция Internal Download API)

**Interfaces:**
- Consumes: поведение из Task 1 (401/403 от `open.faceit.com` долетает до `.catch` в `startVoiceExtraction` с `err.status`).
- Produces: только тексты — API не меняется.

- [ ] **Step 1: Новый hint при 401/403**

`server/src/services/voice.service.ts`, в `.catch` (строки 84–89) заменить ветку 401/403:

```ts
      job.error =
        err?.code === "DEMO_NOT_AVAILABLE"
          ? "Демка недоступна — FACEIT хранит демки ограниченное время"
          : err?.status === 401 || err?.status === 403
            ? "Downloads API отклонил FACEIT_API_KEY — проверьте, что ключ от приложения с одобренным доступом к Downloads API"
            : err?.message ?? "Неизвестная ошибка"
```

- [ ] **Step 2: Убрать startup-warn про session-токен**

`server/src/index.ts` — удалить строки 48–50 целиком:

```ts
  if (!process.env.FACEIT_SESSION_TOKEN) {
    console.warn("⚠ FACEIT_SESSION_TOKEN не задан в .env — извлечение голосов из демок не будет работать")
  }
```

(Warn про `FACEIT_API_KEY` строками выше остаётся — он теперь покрывает и голоса.)

- [ ] **Step 3: CLAUDE.md — секция Downloads API**

Заменить секцию «Internal Download API» (строки 226–234, от `### Internal Download API` до конца абзаца про `FACEIT_SESSION_TOKEN`) на:

```markdown
### Downloads API (`open.faceit.com/download/v2`)

Authenticated via `FACEIT_API_KEY` (Bearer) — the key must belong to an app with approved Downloads API access (application form, ~30 days). Uses `fetch`.

| Endpoint | Used in | Cached | Notes |
|---|---|---|---|
| `POST /demos/download` | `fetchSignedDemoUrl()` | No | Exchanges match `demo_url` for a signed, time-limited download URL |
```

- [ ] **Step 4: Typecheck server**

Run: `npm run typecheck:server`
Expected: без ошибок.

Проверить отсутствие хвостов: grep `FACEIT_SESSION_TOKEN` по репозиторию — совпадения только в `docs/superpowers/` (историческая спека/план) и памяти, не в коде/CLAUDE.md.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/voice.service.ts server/src/index.ts CLAUDE.md
git commit -m "chore(server,docs): тексты и дока под официальный Downloads API"
```

---

### Task 4: Верификация live

**Files:** нет изменений кода (только прогон).

**Interfaces:**
- Consumes: всё из Task 1–3; `FACEIT_API_KEY` из корневого `.env`.

- [ ] **Step 1: Полный typecheck и тесты**

Run: `npm run typecheck` и `npm run test -w @faceit/core`
Expected: оба зелёные.

- [ ] **Step 2: Live-curl официального эндпоинта**

Взять любой недавний матч с демкой (matchId из `.cache/voices/` или свежий с faceit.com). Достать `resource_url` через Data API и обменять на signed URL (bash, из корня репо):

```bash
source <(grep FACEIT_API_KEY .env | sed 's/^/export /')
MATCH_ID="<matchId>"
RESOURCE_URL=$(curl -s "https://open.faceit.com/data/v4/matches/$MATCH_ID" \
  -H "Authorization: Bearer $FACEIT_API_KEY" | node -e "
let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
  const j=JSON.parse(d);console.log((j.demo_url||[])[0]||'');
});")
echo "resource_url: $RESOURCE_URL"
curl -s -w "\nHTTP %{http_code}\n" "https://open.faceit.com/download/v2/demos/download" \
  -X POST -H "Authorization: Bearer $FACEIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"resource_url\":\"$RESOURCE_URL\"}"
```

Expected: `HTTP 200` и JSON с `payload.download_url`.

**Если HTTP 403 — СТОП.** Не ретраить, не дебажить: FACEIT мог ещё не до конца выдать доступ (одобрение свежее). Зафиксировать факт в итоговом отчёте, код остаётся как есть (форма запроса подтверждена докой). Проверить позже вручную тем же curl.

- [ ] **Step 3: Интеграционный прогон (только при успешном curl)**

Матч должен быть некеширован; если брали matchId из `.cache/voices/`, сначала удалить его папку (`.cache` — регенерируемый кеш):

```bash
rm -rf ".cache/voices/$MATCH_ID"
npm run voice -- "$MATCH_ID"
```

Expected: прогресс download → extract → transcode, таблица игроков, MP3 в `.cache/voices/{matchId}/`.

- [ ] **Step 4: Напомнить пользователю про .env**

В итоговом отчёте: `FACEIT_SESSION_TOKEN` можно удалить из корневого `.env` — больше не читается.
