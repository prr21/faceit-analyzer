# Match Voice Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Прослушивание голосового чата игроков из FACEIT-матча: CLI-команда + web-панель на странице игрока, общая логика в `core/voice`.

**Architecture:** `core/voice` скачивает демку (внутренний download-url эндпоинт faceit.com по `FACEIT_SESSION_TOKEN` или локальный .dem), запускает бинарник [csgo-voice-extractor](https://github.com/akiver/csgo-voice-extractor) в режиме `split-compact`, конвертирует WAV→MP3 через `ffmpeg-static` и кладёт результат в `.cache/voices/{matchId}/` с `manifest.json`. CLI и Express-сервер вызывают один usecase `fetchMatchVoices`; сервер держит in-memory джобы и отдаёт MP3 статикой; web поллит статус и рендерит `<audio>`-плееры.

**Tech Stack:** TypeScript (tsx runtime), Express, React + TanStack Query + Tailwind v4, vitest, ffmpeg-static, extract-zip.

**Spec:** `docs/superpowers/specs/2026-07-19-voice-playback-design.md`

## Global Constraints

- Комментарии и console-вывод — на русском (правило проекта).
- Web UI: обязательно dark mode + mobile responsive.
- Импорт-правила web: `app → pages → features → shared`; `features/report` может компоновать `features/voice`; кросс-папочные импорты только через `@/`.
- Сервисы сервера НЕ глотают ошибки блэнкет-catch'ем: специфика → `AppError`, остальное — rethrow в `errorHandler`.
- Единый `.env` в корне монорепо (не дублировать в server/web). Новая переменная: `FACEIT_SESSION_TOKEN`.
- Пиненые константы: csgove `v3.1.6`, ассеты `win32-x64.zip` / `linux-x64.zip` / `darwin-x64.zip`; эндпоинт `https://www.faceit.com/api/download/v2/demos/download-url` (форма ответа `{payload:{download_url}}` — как в официальном Downloads API).
- MP3: mono, 64 kbps.
- Кеш голосов вечный (immutable), демки удаляются после экстракции, WAV — после конвертации.
- Директории `.cache/` и `tools/` резолвятся от cwd (та же конвенция, что `FileSystemCache`).

---

### Task 1: Каркас — типы, константы, env, vitest в core

**Files:**
- Create: `core/types/voice.ts`
- Create: `core/vitest.config.ts`
- Create: `core/__tests__/env.test.ts`
- Modify: `core/types/index.ts` (добавить строку экспорта)
- Modify: `core/types/api.ts` (два поля)
- Modify: `core/constants.ts` (блок констант)
- Modify: `core/env.ts` (новый getter)
- Modify: `core/index.ts` (экспорты)
- Modify: `core/package.json` (deps + test script)
- Modify: `.gitignore` (строка `tools/`)

**Interfaces:**
- Produces: типы `VoicePlayerAudio`, `VoiceManifest`, `VoiceProgressStep`, `VoicePlayerDto`, `VoiceStatusDto`, `VoiceJobStatusKind`; константы `CSGOVE_VERSION`, `CSGOVE_DOWNLOAD_BASE`, `FACEIT_DOWNLOAD_API_URL`, `VOICE_MP3_BITRATE`; `getFaceitSessionToken(): string`. Все последующие задачи их используют.

- [ ] **Step 1: Зависимости и test-инфраструктура core**

В `core/package.json` добавить в `dependencies`: `"ffmpeg-static": "^5.2.0"`, `"extract-zip": "^2.0.1"`; в `devDependencies`: `"vitest": "^3.1.0"`; в корень объекта — `"scripts": { "test": "vitest run" }`.

Создать `core/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
  },
})
```

Выполнить из корня репо: `npm install`
Ожидаемо: lockfile обновлён, ошибок нет.

- [ ] **Step 2: Failing-тест для getFaceitSessionToken**

Создать `core/__tests__/env.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest"
import { getFaceitSessionToken } from "../env"

describe("getFaceitSessionToken", () => {
  const saved = process.env.FACEIT_SESSION_TOKEN
  afterEach(() => {
    if (saved === undefined) delete process.env.FACEIT_SESSION_TOKEN
    else process.env.FACEIT_SESSION_TOKEN = saved
  })

  it("возвращает токен, когда задан", () => {
    process.env.FACEIT_SESSION_TOKEN = "test-token"
    expect(getFaceitSessionToken()).toBe("test-token")
  })

  it("бросает понятную ошибку без токена", () => {
    delete process.env.FACEIT_SESSION_TOKEN
    expect(() => getFaceitSessionToken()).toThrow("FACEIT_SESSION_TOKEN")
  })
})
```

Запустить: `npm test -w @faceit/core`
Ожидаемо: FAIL — `getFaceitSessionToken` не экспортируется.

- [ ] **Step 3: Реализация типов, констант, env**

В `core/env.ts` добавить:

```ts
export function getFaceitSessionToken(): string {
  const token = process.env.FACEIT_SESSION_TOKEN
  if (!token) {
    throw new Error(
      "FACEIT_SESSION_TOKEN is not set in .env — возьмите Bearer-токен из DevTools на faceit.com (Network → заголовок Authorization любого запроса к api)",
    )
  }
  return token
}
```

В `core/constants.ts` добавить в конец:

```ts
// Голоса из демок
export const CSGOVE_VERSION = "v3.1.6"
export const CSGOVE_DOWNLOAD_BASE =
  "https://github.com/akiver/csgo-voice-extractor/releases/download"
export const FACEIT_DOWNLOAD_API_URL =
  "https://www.faceit.com/api/download/v2/demos/download-url"
export const VOICE_MP3_BITRATE = "64k"
```

Создать `core/types/voice.ts`:

```ts
// Типы фичи «голоса из матча» — общие для core, server и web

export interface VoicePlayerAudio {
  playerId: string
  nickname: string
  steamId64: string
  faction: "faction1" | "faction2"
  /** Абсолютный путь к mp3 (в manifest.json на диске — относительное имя файла) */
  filePath: string
  fileSize: number
}

export interface VoiceManifest {
  matchId: string
  extractedAt: number
  mode: "split-compact"
  players: VoicePlayerAudio[]
}

export type VoiceProgressStep = "download" | "extract" | "transcode"

// DTO для HTTP (server → web): вместо filePath — url
export interface VoicePlayerDto {
  playerId: string
  nickname: string
  steamId64: string
  faction: "faction1" | "faction2"
  fileSize: number
  url: string
}

export type VoiceJobStatusKind = "none" | "pending" | "extracting" | "done" | "error"

export interface VoiceStatusDto {
  status: VoiceJobStatusKind
  step?: VoiceProgressStep
  players?: VoicePlayerDto[]
  error?: string
}
```

В `core/types/index.ts` добавить строку (рядом с остальными re-export):

```ts
export * from "./voice"
```

В `core/types/api.ts`: в `FaceitPlayer` добавить поле `steam_id_64?: string` (после `country?`), в `FaceitMatchDetail` — `demo_url?: string[]` (после `faceit_url?`).

В `core/index.ts` в секцию `// Env` добавить:

```ts
export { getFaceitSessionToken } from "./env"
```

и в секцию `// Constants` дописать `CSGOVE_VERSION, CSGOVE_DOWNLOAD_BASE, FACEIT_DOWNLOAD_API_URL, VOICE_MP3_BITRATE` в существующий export-список.

В `.gitignore` после строки `.cache/` добавить строку `tools/`.

- [ ] **Step 4: Тесты и typecheck зелёные**

Запустить: `npm test -w @faceit/core` → PASS (2 теста).
Запустить: `npm run typecheck:core` → без ошибок.

- [ ] **Step 5: Commit**

```bash
git add core/ .gitignore package-lock.json
git commit -m "feat(core): типы, константы и env для извлечения голосов + vitest в core"
```

---

### Task 2: manifest.ts — чистая логика (parseMatchId, steamId, сборка манифеста)

**Files:**
- Create: `core/voice/manifest.ts`
- Test: `core/__tests__/voice-manifest.test.ts`

**Interfaces:**
- Consumes: типы из Task 1 (`VoiceManifest`, `VoicePlayerAudio`, `FaceitMatchDetail`).
- Produces: `parseMatchId(input: string): string`; `extractSteamId(fileName: string): string | null`; `collectRoster(match: FaceitMatchDetail): { playerId: string; nickname: string; faction: "faction1" | "faction2" }[]`; `interface RosterEntry { playerId; nickname; faction; steamId64: string | null }`; `buildVoiceManifest(matchId: string, roster: RosterEntry[], mp3Files: { steamId64: string; filePath: string; fileSize: number }[]): VoiceManifest`.

- [ ] **Step 1: Failing-тесты**

Создать `core/__tests__/voice-manifest.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import {
  parseMatchId,
  extractSteamId,
  collectRoster,
  buildVoiceManifest,
} from "../voice/manifest"
import type { FaceitMatchDetail } from "../types/index"

describe("parseMatchId", () => {
  it("голый id проходит как есть", () => {
    expect(parseMatchId("1-abc123-def")).toBe("1-abc123-def")
  })

  it("достаёт id из ссылки на match room", () => {
    expect(
      parseMatchId("https://www.faceit.com/en/cs2/room/1-cb038819-b0d0-4471-b25c-0e7468ab1eb1/scoreboard"),
    ).toBe("1-cb038819-b0d0-4471-b25c-0e7468ab1eb1")
  })

  it("обрезает пробелы", () => {
    expect(parseMatchId("  1-abc  ")).toBe("1-abc")
  })
})

describe("extractSteamId", () => {
  it("достаёт 17-значный steamId из имени WAV", () => {
    expect(extractSteamId("C:/out/demo_76561198012345678.wav")).toBe("76561198012345678")
  })

  it("null, если steamId нет", () => {
    expect(extractSteamId("readme.txt")).toBeNull()
  })
})

function makeMatch(): FaceitMatchDetail {
  return {
    match_id: "1-m",
    started_at: 0,
    best_of: 1,
    teams: {
      faction1: { leader: "p1", roster: [{ player_id: "p1", nickname: "Alpha", faceit_url: "" }] },
      faction2: { leader: "p2", players: [{ player_id: "p2", nickname: "Bravo", faceit_url: "" }] },
    },
  }
}

describe("collectRoster", () => {
  it("собирает обе команды, roster с фолбэком на players", () => {
    expect(collectRoster(makeMatch())).toEqual([
      { playerId: "p1", nickname: "Alpha", faction: "faction1" },
      { playerId: "p2", nickname: "Bravo", faction: "faction2" },
    ])
  })
})

describe("buildVoiceManifest", () => {
  const roster = [
    { playerId: "p1", nickname: "Alpha", faction: "faction1" as const, steamId64: "76561198000000001" },
    { playerId: "p2", nickname: "Bravo", faction: "faction2" as const, steamId64: null },
  ]

  it("мапит mp3 на игроков по steamId", () => {
    const m = buildVoiceManifest("1-m", roster, [
      { steamId64: "76561198000000001", filePath: "76561198000000001.mp3", fileSize: 100 },
    ])
    expect(m.matchId).toBe("1-m")
    expect(m.mode).toBe("split-compact")
    expect(m.players).toHaveLength(1)
    expect(m.players[0]).toMatchObject({ playerId: "p1", nickname: "Alpha", faction: "faction1" })
  })

  it("пропускает файлы не из ростера, пустой список валиден", () => {
    const m = buildVoiceManifest("1-m", roster, [
      { steamId64: "76561198999999999", filePath: "x.mp3", fileSize: 5 },
    ])
    expect(m.players).toEqual([])
  })
})
```

Запустить: `npm test -w @faceit/core` → FAIL (модуль `../voice/manifest` не существует).

- [ ] **Step 2: Реализация**

Создать `core/voice/manifest.ts`:

```ts
import path from "path"
import type { FaceitMatchDetail } from "../types/index"
import type { VoiceManifest, VoicePlayerAudio } from "../types/voice"

/** matchId из ссылки на match room или из голого id */
export function parseMatchId(input: string): string {
  const trimmed = input.trim()
  const roomMatch = trimmed.match(/\/room\/([0-9a-zA-Z-]+)/)
  return roomMatch ? roomMatch[1] : trimmed
}

/** SteamID64 (17 цифр) из имени WAV-файла экстрактора */
export function extractSteamId(fileName: string): string | null {
  const m = path.basename(fileName).match(/(\d{17})/)
  return m ? m[1] : null
}

export interface RosterEntry {
  playerId: string
  nickname: string
  faction: "faction1" | "faction2"
  steamId64: string | null
}

/** Ростер обеих команд из деталей матча (roster с фолбэком на players) */
export function collectRoster(
  match: FaceitMatchDetail,
): Omit<RosterEntry, "steamId64">[] {
  const result: Omit<RosterEntry, "steamId64">[] = []
  for (const faction of ["faction1", "faction2"] as const) {
    const team = match.teams?.[faction]
    const players = team?.roster ?? team?.players ?? []
    for (const p of players) {
      result.push({ playerId: p.player_id, nickname: p.nickname, faction })
    }
  }
  return result
}

/** Собирает манифест: mp3-файлы (имя = steamId64) + ростер → кто говорил */
export function buildVoiceManifest(
  matchId: string,
  roster: RosterEntry[],
  mp3Files: { steamId64: string; filePath: string; fileSize: number }[],
): VoiceManifest {
  const bySteamId = new Map(
    roster.filter(r => r.steamId64).map(r => [r.steamId64 as string, r]),
  )
  const players: VoicePlayerAudio[] = []
  for (const file of mp3Files) {
    const entry = bySteamId.get(file.steamId64)
    if (!entry) continue // голос не из ростера (наблюдатель и т.п.)
    players.push({
      playerId: entry.playerId,
      nickname: entry.nickname,
      steamId64: file.steamId64,
      faction: entry.faction,
      filePath: file.filePath,
      fileSize: file.fileSize,
    })
  }
  return { matchId, extractedAt: Date.now(), mode: "split-compact", players }
}
```

- [ ] **Step 3: Тесты зелёные**

`npm test -w @faceit/core` → PASS. `npm run typecheck:core` → чисто.

- [ ] **Step 4: Commit**

```bash
git add core/voice/manifest.ts core/__tests__/voice-manifest.test.ts
git commit -m "feat(core): parseMatchId, extractSteamId и сборка VoiceManifest"
```

---

### Task 3: demo.ts — скачивание демки по сессионному токену

**Files:**
- Create: `core/voice/demo.ts`
- Test: `core/__tests__/voice-demo.test.ts`

**Interfaces:**
- Consumes: `FACEIT_DOWNLOAD_API_URL` (Task 1), `withRetry` (`core/infra/retry`).
- Produces: `getDemoResourceUrl(match: FaceitMatchDetail): string | null`; `fetchSignedDemoUrl(resourceUrl: string, sessionToken: string, fetchFn?: typeof fetch): Promise<string>`; `downloadDemo(signedUrl: string, destPath: string, fetchFn?: typeof fetch): Promise<void>` (gunzip на лету для `.gz`). Ошибки HTTP несут `err.status` (совместимо с `upstreamStatus()` сервера и `withRetry`).

- [ ] **Step 1: Ручная верификация эндпоинта (best-effort, не блокирует)**

Если под рукой есть свежий токен: взять `demo_url` любого свежего матча и выполнить

```bash
curl -s -X POST "https://www.faceit.com/api/download/v2/demos/download-url" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $FACEIT_SESSION_TOKEN" \
  -d '{"resource_url":"<demo_url из матча>"}'
```

Ожидаемо: JSON с `payload.download_url`. Если 404 — открыть DevTools на кнопке «Download demo» в match room и поправить константу `FACEIT_DOWNLOAD_API_URL` (изолирована в `core/constants.ts`). Без токена — пропустить шаг, финальная интеграция (Task 11) проверит.

- [ ] **Step 2: Failing-тесты**

Создать `core/__tests__/voice-demo.test.ts`:

```ts
import fs from "fs"
import os from "os"
import path from "path"
import { gzipSync } from "zlib"
import { describe, it, expect } from "vitest"
import { getDemoResourceUrl, fetchSignedDemoUrl, downloadDemo } from "../voice/demo"
import type { FaceitMatchDetail } from "../types/index"

const baseMatch: FaceitMatchDetail = {
  match_id: "1-m",
  started_at: 0,
  best_of: 1,
  teams: {
    faction1: { leader: "", players: [] },
    faction2: { leader: "", players: [] },
  },
}

describe("getDemoResourceUrl", () => {
  it("первый demo_url", () => {
    expect(getDemoResourceUrl({ ...baseMatch, demo_url: ["https://demos.faceit.com/x.dem.gz"] }))
      .toBe("https://demos.faceit.com/x.dem.gz")
  })
  it("null без demo_url", () => {
    expect(getDemoResourceUrl(baseMatch)).toBeNull()
  })
})

describe("fetchSignedDemoUrl", () => {
  it("возвращает payload.download_url и шлёт Bearer", async () => {
    let captured: any
    const fetchFn = (async (url: any, init: any) => {
      captured = { url, init }
      return new Response(JSON.stringify({ payload: { download_url: "https://signed/x" } }))
    }) as typeof fetch

    const url = await fetchSignedDemoUrl("https://demos.faceit.com/x.dem.gz", "tok", fetchFn)
    expect(url).toBe("https://signed/x")
    expect(captured.init.method).toBe("POST")
    expect(captured.init.headers.Authorization).toBe("Bearer tok")
    expect(JSON.parse(captured.init.body)).toEqual({ resource_url: "https://demos.faceit.com/x.dem.gz" })
  })

  it("HTTP-ошибка несёт status (для errorHandler/withRetry)", async () => {
    const fetchFn = (async () => new Response("nope", { status: 403 })) as typeof fetch
    await expect(fetchSignedDemoUrl("r", "tok", fetchFn)).rejects.toMatchObject({ status: 403 })
  })

  it("ошибка при ответе без download_url", async () => {
    const fetchFn = (async () => new Response(JSON.stringify({ payload: {} }))) as typeof fetch
    await expect(fetchSignedDemoUrl("r", "tok", fetchFn)).rejects.toThrow("download_url")
  })
})

describe("downloadDemo", () => {
  it("распаковывает .gz на лету", async () => {
    const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "demo-")), "m.dem")
    const gz = gzipSync(Buffer.from("DEMO-BYTES"))
    const fetchFn = (async () => new Response(gz)) as typeof fetch

    await downloadDemo("https://signed.test/x.dem.gz", dest, fetchFn)
    expect(fs.readFileSync(dest, "utf-8")).toBe("DEMO-BYTES")
  })

  it("пишет как есть без .gz", async () => {
    const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "demo-")), "m.dem")
    const fetchFn = (async () => new Response(Buffer.from("RAW"))) as typeof fetch

    await downloadDemo("https://signed.test/x.dem", dest, fetchFn)
    expect(fs.readFileSync(dest, "utf-8")).toBe("RAW")
  })
})
```

Запустить: `npm test -w @faceit/core` → FAIL (модуль не существует).

- [ ] **Step 3: Реализация**

Создать `core/voice/demo.ts`:

```ts
import fs from "fs"
import path from "path"
import { Readable } from "stream"
import { pipeline } from "stream/promises"
import { createGunzip } from "zlib"
import type { FaceitMatchDetail } from "../types/index"
import { FACEIT_DOWNLOAD_API_URL } from "../constants"
import { withRetry } from "../infra/retry"

/** resource_url демки из деталей матча (null — демка недоступна) */
export function getDemoResourceUrl(match: FaceitMatchDetail): string | null {
  return match.demo_url?.[0] ?? null
}

/** Обмен resource_url на подписанный download_url (внутренний эндпоинт faceit.com) */
export async function fetchSignedDemoUrl(
  resourceUrl: string,
  sessionToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  return withRetry(async () => {
    const response = await fetchFn(FACEIT_DOWNLOAD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
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

/** Скачивает демку в destPath, распаковывая gzip на лету для .gz */
export async function downloadDemo(
  signedUrl: string,
  destPath: string,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchFn(signedUrl)
  if (!response.ok || !response.body) {
    const err: any = new Error(`HTTP ${response.status} при скачивании демки`)
    err.status = response.status
    throw err
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  const source = Readable.fromWeb(response.body as any)
  const isGzip = new URL(signedUrl).pathname.endsWith(".gz")
  if (isGzip) {
    await pipeline(source, createGunzip(), fs.createWriteStream(destPath))
  } else {
    await pipeline(source, fs.createWriteStream(destPath))
  }
}
```

- [ ] **Step 4: Тесты зелёные**

`npm test -w @faceit/core` → PASS. `npm run typecheck:core` → чисто.

- [ ] **Step 5: Commit**

```bash
git add core/voice/demo.ts core/__tests__/voice-demo.test.ts
git commit -m "feat(core): скачивание демки через download-url эндпоинт с gunzip на лету"
```

---

### Task 4: binary.ts — авто-скачивание csgove

**Files:**
- Create: `core/voice/binary.ts`
- Test: `core/__tests__/voice-binary.test.ts`

**Interfaces:**
- Consumes: `CSGOVE_VERSION`, `CSGOVE_DOWNLOAD_BASE` (Task 1); `extract-zip`.
- Produces: `csgoveAssetName(platform?: NodeJS.Platform): string`; `csgoveBinaryName(platform?: NodeJS.Platform): string`; `ensureExtractor(toolsDir?: string, fetchArchive?: (url: string, destDir: string) => Promise<void>): Promise<string>` — возвращает путь к exe. Скачивание+распаковка инкапсулированы в один инъектируемый `fetchArchive` (реальный вариант проверяет интеграционный прогон в Task 11).

- [ ] **Step 1: Failing-тесты**

Создать `core/__tests__/voice-binary.test.ts`:

```ts
import fs from "fs"
import os from "os"
import path from "path"
import { describe, it, expect } from "vitest"
import { csgoveAssetName, csgoveBinaryName, ensureExtractor } from "../voice/binary"

describe("csgoveAssetName", () => {
  it("мапит платформы на ассеты релиза", () => {
    expect(csgoveAssetName("win32")).toBe("win32-x64.zip")
    expect(csgoveAssetName("linux")).toBe("linux-x64.zip")
    expect(csgoveAssetName("darwin")).toBe("darwin-x64.zip")
  })
  it("бросает на неподдерживаемой платформе", () => {
    expect(() => csgoveAssetName("freebsd" as NodeJS.Platform)).toThrow("не поддерживается")
  })
})

describe("ensureExtractor", () => {
  it("возвращает существующий бинарник без скачивания", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csgove-"))
    const exe = path.join(dir, csgoveBinaryName())
    fs.writeFileSync(exe, "stub")
    let called = false

    const result = await ensureExtractor(dir, async () => { called = true })
    expect(result).toBe(exe)
    expect(called).toBe(false)
  })

  it("скачивает при отсутствии и возвращает путь", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csgove-"))
    let capturedUrl = ""
    const fetchArchive = async (url: string, destDir: string) => {
      capturedUrl = url
      fs.writeFileSync(path.join(destDir, csgoveBinaryName()), "stub")
    }

    const result = await ensureExtractor(dir, fetchArchive)
    expect(result).toBe(path.join(dir, csgoveBinaryName()))
    expect(capturedUrl).toContain("v3.1.6")
    expect(capturedUrl).toContain(csgoveAssetName())
  })

  it("бросает, если после скачивания бинарника нет", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "csgove-"))
    await expect(ensureExtractor(dir, async () => {})).rejects.toThrow("не найден")
  })
})
```

Запустить: `npm test -w @faceit/core` → FAIL.

- [ ] **Step 2: Реализация**

Создать `core/voice/binary.ts`:

```ts
import fs from "fs"
import path from "path"
import { Readable } from "stream"
import { pipeline } from "stream/promises"
import extractZip from "extract-zip"
import { CSGOVE_DOWNLOAD_BASE, CSGOVE_VERSION } from "../constants"

/** Имя ассета релиза csgove для платформы */
export function csgoveAssetName(platform: NodeJS.Platform = process.platform): string {
  switch (platform) {
    case "win32": return "win32-x64.zip"
    case "linux": return "linux-x64.zip"
    case "darwin": return "darwin-x64.zip"
    default:
      throw new Error(`Платформа ${platform} не поддерживается csgo-voice-extractor`)
  }
}

export function csgoveBinaryName(platform: NodeJS.Platform = process.platform): string {
  return platform === "win32" ? "csgove.exe" : "csgove"
}

/** Реальное скачивание релиза + распаковка (в тестах подменяется целиком) */
async function downloadAndUnzip(url: string, destDir: string): Promise<void> {
  const zipPath = path.join(destDir, "csgove.zip")
  const response = await fetch(url, { redirect: "follow" })
  if (!response.ok || !response.body) {
    const err: any = new Error(`HTTP ${response.status} при скачивании ${url}`)
    err.status = response.status
    throw err
  }
  await pipeline(Readable.fromWeb(response.body as any), fs.createWriteStream(zipPath))
  await extractZip(zipPath, { dir: destDir })
  fs.rmSync(zipPath)
}

/**
 * Гарантирует наличие бинарника csgove: качает и распаковывает релиз
 * при первом вызове. Возвращает путь к исполняемому файлу.
 */
export async function ensureExtractor(
  toolsDir: string = path.resolve("tools", "csgove"),
  fetchArchive: (url: string, destDir: string) => Promise<void> = downloadAndUnzip,
): Promise<string> {
  const exePath = path.join(toolsDir, csgoveBinaryName())
  if (fs.existsSync(exePath)) return exePath

  fs.mkdirSync(toolsDir, { recursive: true })
  const asset = csgoveAssetName()
  console.log(`⬇️ Скачивание csgo-voice-extractor ${CSGOVE_VERSION} (${asset})...`)
  await fetchArchive(`${CSGOVE_DOWNLOAD_BASE}/${CSGOVE_VERSION}/${asset}`, toolsDir)

  if (!fs.existsSync(exePath)) {
    throw new Error(`После распаковки не найден ${exePath} — проверьте структуру релиза csgove`)
  }
  if (process.platform !== "win32") fs.chmodSync(exePath, 0o755)
  return exePath
}
```

- [ ] **Step 3: Тесты зелёные**

`npm test -w @faceit/core` → PASS. `npm run typecheck:core` → чисто.

- [ ] **Step 4: Commit**

```bash
git add core/voice/binary.ts core/__tests__/voice-binary.test.ts
git commit -m "feat(core): авто-скачивание бинарника csgove с GitHub Releases"
```

---

### Task 5: runner + extract + transcode

**Files:**
- Create: `core/voice/runner.ts`
- Create: `core/voice/extract.ts`
- Create: `core/voice/transcode.ts`
- Test: `core/__tests__/voice-extract.test.ts`

**Interfaces:**
- Consumes: `VOICE_MP3_BITRATE` (Task 1); `ffmpeg-static`.
- Produces: `interface RunResult { code: number; stderr: string }`; `type ProcessRunner = (command: string, args: string[]) => Promise<RunResult>`; `spawnRunner: ProcessRunner`; `extractVoices(exePath: string, demoPath: string, outDir: string, runner?: ProcessRunner): Promise<string[]>` (пути WAV); `transcodeToMp3(wavPath: string, mp3Path: string, runner?: ProcessRunner): Promise<void>`.

- [ ] **Step 1: Failing-тесты**

Создать `core/__tests__/voice-extract.test.ts`:

```ts
import fs from "fs"
import os from "os"
import path from "path"
import { describe, it, expect } from "vitest"
import { extractVoices } from "../voice/extract"
import { transcodeToMp3 } from "../voice/transcode"
import type { ProcessRunner } from "../voice/runner"

describe("extractVoices", () => {
  it("запускает csgove с нужными флагами и возвращает WAV-файлы", async () => {
    const outDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "wav-")), "out")
    let captured: string[] = []
    const runner: ProcessRunner = async (_cmd, args) => {
      captured = args
      fs.writeFileSync(path.join(outDir, "m_76561198000000001.wav"), "a")
      fs.writeFileSync(path.join(outDir, "m_76561198000000002.wav"), "b")
      fs.writeFileSync(path.join(outDir, "notes.txt"), "x")
      return { code: 0, stderr: "" }
    }

    const wavs = await extractVoices("csgove.exe", "m.dem", outDir, runner)
    expect(wavs).toHaveLength(2)
    expect(wavs.every(w => w.endsWith(".wav"))).toBe(true)
    expect(captured).toEqual(["-mode", "split-compact", "-output", outDir, "m.dem"])
  })

  it("бросает при ненулевом коде выхода со stderr в сообщении", async () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "wav-"))
    const runner: ProcessRunner = async () => ({ code: 2, stderr: "boom" })
    await expect(extractVoices("csgove.exe", "m.dem", outDir, runner)).rejects.toThrow("boom")
  })
})

describe("transcodeToMp3", () => {
  it("вызывает ffmpeg: mono, 64k, перезапись", async () => {
    let captured: string[] = []
    const runner: ProcessRunner = async (_cmd, args) => {
      captured = args
      return { code: 0, stderr: "" }
    }
    await transcodeToMp3("in.wav", "out.mp3", runner)
    expect(captured).toEqual(["-y", "-i", "in.wav", "-ac", "1", "-b:a", "64k", "out.mp3"])
  })

  it("бросает при ошибке ffmpeg", async () => {
    const runner: ProcessRunner = async () => ({ code: 1, stderr: "bad wav" })
    await expect(transcodeToMp3("in.wav", "out.mp3", runner)).rejects.toThrow("bad wav")
  })
})
```

Запустить: `npm test -w @faceit/core` → FAIL.

- [ ] **Step 2: Реализация**

Создать `core/voice/runner.ts`:

```ts
import { spawn } from "child_process"

export interface RunResult {
  code: number
  stderr: string
}

export type ProcessRunner = (command: string, args: string[]) => Promise<RunResult>

/** Запуск внешнего процесса; stdout не нужен, stderr собираем для ошибок */
export const spawnRunner: ProcessRunner = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] })
    let stderr = ""
    child.stderr.on("data", chunk => { stderr += chunk })
    child.on("error", reject)
    child.on("close", code => resolve({ code: code ?? -1, stderr }))
  })
```

Создать `core/voice/extract.ts`:

```ts
import fs from "fs"
import path from "path"
import { spawnRunner, type ProcessRunner } from "./runner"

/** Запускает csgove (split-compact), возвращает пути созданных WAV */
export async function extractVoices(
  exePath: string,
  demoPath: string,
  outDir: string,
  runner: ProcessRunner = spawnRunner,
): Promise<string[]> {
  fs.mkdirSync(outDir, { recursive: true })
  // Go-флаги идут строго до позиционного аргумента (пути демки)
  const { code, stderr } = await runner(exePath, [
    "-mode", "split-compact",
    "-output", outDir,
    demoPath,
  ])
  if (code !== 0) {
    throw new Error(`csgove завершился с кодом ${code}: ${stderr.slice(0, 500)}`)
  }
  return fs
    .readdirSync(outDir)
    .filter(f => f.toLowerCase().endsWith(".wav"))
    .map(f => path.join(outDir, f))
}
```

Создать `core/voice/transcode.ts`:

```ts
import ffmpegPath from "ffmpeg-static"
import { VOICE_MP3_BITRATE } from "../constants"
import { spawnRunner, type ProcessRunner } from "./runner"

/** WAV → MP3 (mono, 64 kbps) через ffmpeg-static */
export async function transcodeToMp3(
  wavPath: string,
  mp3Path: string,
  runner: ProcessRunner = spawnRunner,
): Promise<void> {
  if (!ffmpegPath) throw new Error("ffmpeg-static не нашёл бинарник для этой платформы")
  const { code, stderr } = await runner(ffmpegPath as string, [
    "-y",
    "-i", wavPath,
    "-ac", "1",
    "-b:a", VOICE_MP3_BITRATE,
    mp3Path,
  ])
  if (code !== 0) {
    throw new Error(`ffmpeg завершился с кодом ${code}: ${stderr.slice(0, 500)}`)
  }
}
```

Если `tsc` ругается на типы `ffmpeg-static`: пакет содержит собственный `index.d.ts` (`export default string | null`) — проверить, что импорт именно default.

- [ ] **Step 3: Тесты зелёные**

`npm test -w @faceit/core` → PASS. `npm run typecheck:core` → чисто.

- [ ] **Step 4: Commit**

```bash
git add core/voice/runner.ts core/voice/extract.ts core/voice/transcode.ts core/__tests__/voice-extract.test.ts
git commit -m "feat(core): запуск csgove и конвертация WAV в MP3 через инъектируемый runner"
```

---

### Task 6: usecase fetchMatchVoices — оркестрация + кеш

**Files:**
- Create: `core/usecases/voice.ts`
- Modify: `core/index.ts` (экспорты)
- Test: `core/__tests__/voice-usecase.test.ts`

**Interfaces:**
- Consumes: всё из Task 2–5; `getMatchInfo`, `getPlayerInfo` (`api/faceit-open`), `withCache`, `setCacheProvider`, `batchWithLimit`, `getFaceitSessionToken`.
- Produces (экспортируется из `@faceit/core`):
  - `setVoiceStorageRoot(voicesDir: string, demosDir: string): void` — для тестов/кастомного размещения;
  - `voiceMatchDir(matchId: string): string`, `voiceAudioPath(matchId: string, steamId64: string): string`;
  - `loadVoiceManifest(matchId: string): VoiceManifest | null` — читает `manifest.json`, абсолютизирует пути;
  - `fetchMatchVoices(client: FaceitClient, matchIdOrUrl: string, options?: { demoPath?: string; keepDemo?: boolean; onProgress?: (step: VoiceProgressStep) => void; deps?: Partial<VoiceDeps> }): Promise<VoiceManifest>`;
  - `interface VoiceDeps { ensureExtractor; fetchSignedDemoUrl; downloadDemo; extractVoices; transcodeToMp3 }` (сигнатуры функций из Task 3–5).
  - Ошибка «нет демки»: `Error` с полем `code = "DEMO_NOT_AVAILABLE"`.

- [ ] **Step 1: Failing-тесты**

Создать `core/__tests__/voice-usecase.test.ts`:

```ts
import fs from "fs"
import os from "os"
import path from "path"
import { describe, it, expect, beforeEach } from "vitest"
import {
  fetchMatchVoices,
  loadVoiceManifest,
  setVoiceStorageRoot,
  voiceMatchDir,
  type VoiceDeps,
} from "../usecases/voice"
import { setCacheProvider, type CacheProvider } from "../infra/cache"
import type { FaceitClient } from "../api/client"
import type { FaceitMatchDetail } from "../types/index"

// In-memory кеш, чтобы тесты не писали в .cache/
class MemoryCache implements CacheProvider {
  private store = new Map<string, unknown>()
  get<T>(key: string): T | null { return (this.store.get(key) as T) ?? null }
  set<T>(key: string, data: T): void { this.store.set(key, data) }
}

const MATCH_ID = "1-test-match"

function makeMatch(overrides: Partial<FaceitMatchDetail> = {}): FaceitMatchDetail {
  return {
    match_id: MATCH_ID,
    started_at: 0,
    best_of: 1,
    demo_url: ["https://demos.faceit.com/m.dem.gz"],
    teams: {
      faction1: { leader: "p1", roster: [{ player_id: "p1", nickname: "Alpha", faceit_url: "" }] },
      faction2: { leader: "p2", roster: [{ player_id: "p2", nickname: "Bravo", faceit_url: "" }] },
    },
    ...overrides,
  }
}

/** Фейковый axios-клиент: роутит по URL */
function makeClient(match: FaceitMatchDetail): FaceitClient {
  return {
    get: async (url: string) => {
      if (url === `/matches/${MATCH_ID}`) return { data: match }
      if (url === "/players/p1") return { data: { player_id: "p1", nickname: "Alpha", steam_id_64: "76561198000000001" } }
      if (url === "/players/p2") return { data: { player_id: "p2", nickname: "Bravo", steam_id_64: "76561198000000002" } }
      throw new Error(`Неожиданный запрос: ${url}`)
    },
  } as unknown as FaceitClient
}

/** Фейковые side-effect-зависимости: extract пишет WAV, transcode — MP3 */
function makeDeps(calls: string[], wavSteamIds: string[] = ["76561198000000001"]): VoiceDeps {
  return {
    ensureExtractor: async () => { calls.push("ensure"); return "csgove.exe" },
    fetchSignedDemoUrl: async () => { calls.push("signed"); return "https://signed.test/m.dem.gz" },
    downloadDemo: async (_url, dest) => {
      calls.push("download")
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, "DEM")
    },
    extractVoices: async (_exe, _demo, outDir) => {
      calls.push("extract")
      fs.mkdirSync(outDir, { recursive: true })
      return wavSteamIds.map(id => {
        const p = path.join(outDir, `m_${id}.wav`)
        fs.writeFileSync(p, "WAV")
        return p
      })
    },
    transcodeToMp3: async (wav, mp3) => {
      calls.push("transcode")
      fs.writeFileSync(mp3, "MP3")
    },
  }
}

describe("fetchMatchVoices", () => {
  let voicesDir: string
  let demosDir: string

  beforeEach(() => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), "voices-"))
    voicesDir = path.join(base, "voices")
    demosDir = path.join(base, "demos")
    setVoiceStorageRoot(voicesDir, demosDir)
    setCacheProvider(new MemoryCache())
    process.env.FACEIT_SESSION_TOKEN = "tok"
  })

  it("полный прогон: манифест, mp3 на месте, WAV и демка удалены, tmp нет", async () => {
    const calls: string[] = []
    const manifest = await fetchMatchVoices(makeClient(makeMatch()), MATCH_ID, {
      deps: makeDeps(calls),
    })

    expect(manifest.players).toHaveLength(1)
    expect(manifest.players[0]).toMatchObject({
      playerId: "p1", nickname: "Alpha", faction: "faction1", steamId64: "76561198000000001",
    })
    expect(fs.existsSync(manifest.players[0].filePath)).toBe(true)
    expect(fs.existsSync(path.join(voiceMatchDir(MATCH_ID), "manifest.json"))).toBe(true)
    expect(fs.existsSync(`${voiceMatchDir(MATCH_ID)}.tmp`)).toBe(false)
    expect(fs.existsSync(path.join(demosDir, `${MATCH_ID}.dem`))).toBe(false) // демка удалена
    expect(calls).toEqual(["signed", "download", "ensure", "extract", "transcode"])
  })

  it("кеш-хит: повторный вызов не трогает ни API, ни экстрактор", async () => {
    const calls: string[] = []
    await fetchMatchVoices(makeClient(makeMatch()), MATCH_ID, { deps: makeDeps(calls) })
    calls.length = 0

    const failClient = { get: async () => { throw new Error("API не должен вызываться") } } as unknown as FaceitClient
    const manifest = await fetchMatchVoices(failClient, MATCH_ID, { deps: makeDeps(calls) })
    expect(manifest.players).toHaveLength(1)
    expect(calls).toEqual([])
  })

  it("прогресс идёт в порядке download → extract → transcode", async () => {
    const steps: string[] = []
    await fetchMatchVoices(makeClient(makeMatch()), MATCH_ID, {
      deps: makeDeps([]),
      onProgress: s => steps.push(s),
    })
    expect(steps).toEqual(["download", "extract", "transcode"])
  })

  it("пустой манифест валиден (никто не говорил)", async () => {
    const manifest = await fetchMatchVoices(makeClient(makeMatch()), MATCH_ID, {
      deps: makeDeps([], []),
    })
    expect(manifest.players).toEqual([])
    expect(loadVoiceManifest(MATCH_ID)?.players).toEqual([])
  })

  it("без demo_url бросает DEMO_NOT_AVAILABLE", async () => {
    await expect(
      fetchMatchVoices(makeClient(makeMatch({ demo_url: undefined })), MATCH_ID, { deps: makeDeps([]) }),
    ).rejects.toMatchObject({ code: "DEMO_NOT_AVAILABLE" })
  })

  it("при падении экстрактора tmp-папка удаляется, кеша нет", async () => {
    const deps = makeDeps([])
    deps.extractVoices = async () => { throw new Error("crash") }
    await expect(
      fetchMatchVoices(makeClient(makeMatch()), MATCH_ID, { deps }),
    ).rejects.toThrow("crash")
    expect(fs.existsSync(`${voiceMatchDir(MATCH_ID)}.tmp`)).toBe(false)
    expect(loadVoiceManifest(MATCH_ID)).toBeNull()
  })

  it("локальная демка: скачивание пропускается, файл не удаляется", async () => {
    const calls: string[] = []
    const demoPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "local-")), "local.dem")
    fs.writeFileSync(demoPath, "DEM")

    await fetchMatchVoices(makeClient(makeMatch()), MATCH_ID, { deps: makeDeps(calls), demoPath })
    expect(calls).toEqual(["ensure", "extract", "transcode"])
    expect(fs.existsSync(demoPath)).toBe(true)
  })
})
```

Запустить: `npm test -w @faceit/core` → FAIL.

- [ ] **Step 2: Реализация**

Создать `core/usecases/voice.ts`:

```ts
import fs from "fs"
import path from "path"
import type { FaceitClient } from "../api/client"
import type { VoiceManifest, VoiceProgressStep } from "../types/voice"
import { getMatchInfo, getPlayerInfo } from "../api/faceit-open"
import { getFaceitSessionToken } from "../env"
import { withCache } from "../infra/cache"
import { batchWithLimit } from "../infra/concurrency"
import { DEFAULT_CONCURRENCY } from "../constants"
import {
  parseMatchId,
  extractSteamId,
  collectRoster,
  buildVoiceManifest,
  type RosterEntry,
} from "../voice/manifest"
import { getDemoResourceUrl, fetchSignedDemoUrl, downloadDemo } from "../voice/demo"
import { ensureExtractor } from "../voice/binary"
import { extractVoices } from "../voice/extract"
import { transcodeToMp3 } from "../voice/transcode"

let _voicesRoot = path.resolve(".cache", "voices")
let _demosRoot = path.resolve(".cache", "voice-demos")

/** Переопределение директорий хранения (тесты, кастомное размещение) */
export function setVoiceStorageRoot(voicesDir: string, demosDir: string): void {
  _voicesRoot = voicesDir
  _demosRoot = demosDir
}

export function voiceMatchDir(matchId: string): string {
  return path.join(_voicesRoot, matchId)
}

export function voiceAudioPath(matchId: string, steamId64: string): string {
  return path.join(voiceMatchDir(matchId), `${steamId64}.mp3`)
}

/** Готовый манифест из кеша (пути абсолютизируются) или null */
export function loadVoiceManifest(matchId: string): VoiceManifest | null {
  const manifestPath = path.join(voiceMatchDir(matchId), "manifest.json")
  if (!fs.existsSync(manifestPath)) return null
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as VoiceManifest
  for (const p of manifest.players) {
    p.filePath = path.join(voiceMatchDir(matchId), path.basename(p.filePath))
  }
  return manifest
}

// Side-effect-зависимости инъектируются для тестов
export interface VoiceDeps {
  ensureExtractor: typeof ensureExtractor
  fetchSignedDemoUrl: typeof fetchSignedDemoUrl
  downloadDemo: typeof downloadDemo
  extractVoices: typeof extractVoices
  transcodeToMp3: typeof transcodeToMp3
}

const defaultDeps: VoiceDeps = {
  ensureExtractor,
  fetchSignedDemoUrl,
  downloadDemo,
  extractVoices,
  transcodeToMp3,
}

export interface FetchMatchVoicesOptions {
  /** Локальный .dem — пропустить скачивание */
  demoPath?: string
  /** Не удалять скачанную демку */
  keepDemo?: boolean
  onProgress?: (step: VoiceProgressStep) => void
  deps?: Partial<VoiceDeps>
}

const MATCH_ID_RE = /^[0-9a-zA-Z-]{5,100}$/

/**
 * Голоса матча: кеш-хит → готовый манифест, иначе
 * демка → csgove (split-compact) → MP3 → манифест в .cache/voices/{matchId}/
 */
export async function fetchMatchVoices(
  client: FaceitClient,
  matchIdOrUrl: string,
  options: FetchMatchVoicesOptions = {},
): Promise<VoiceManifest> {
  const deps = { ...defaultDeps, ...options.deps }
  const matchId = parseMatchId(matchIdOrUrl)
  if (!MATCH_ID_RE.test(matchId)) throw new Error(`Некорректный matchId: ${matchId}`)

  const cached = loadVoiceManifest(matchId)
  if (cached) return cached

  const match = await getMatchInfo(client, matchId)

  // Демка: локальный файл или скачивание по сессионному токену
  let demoPath = options.demoPath
  let demoDownloaded = false
  if (!demoPath) {
    const resourceUrl = getDemoResourceUrl(match)
    if (!resourceUrl) {
      const err: any = new Error(
        "У матча нет demo_url — демка недоступна (FACEIT хранит демки ограниченное время)",
      )
      err.code = "DEMO_NOT_AVAILABLE"
      throw err
    }
    options.onProgress?.("download")
    const token = getFaceitSessionToken()
    const signedUrl = await deps.fetchSignedDemoUrl(resourceUrl, token)
    demoPath = path.join(_demosRoot, `${matchId}.dem`)
    await deps.downloadDemo(signedUrl, demoPath)
    demoDownloaded = true
  }

  const finalDir = voiceMatchDir(matchId)
  const tmpDir = `${finalDir}.tmp`
  fs.rmSync(tmpDir, { recursive: true, force: true })
  try {
    options.onProgress?.("extract")
    const exePath = await deps.ensureExtractor()
    const wavFiles = await deps.extractVoices(exePath, demoPath, tmpDir)

    options.onProgress?.("transcode")
    const mp3Files: { steamId64: string; filePath: string; fileSize: number }[] = []
    for (const wav of wavFiles) {
      const steamId64 = extractSteamId(wav)
      if (!steamId64) continue
      const mp3Path = path.join(tmpDir, `${steamId64}.mp3`)
      await deps.transcodeToMp3(wav, mp3Path)
      fs.rmSync(wav)
      mp3Files.push({
        steamId64,
        filePath: `${steamId64}.mp3`, // в манифесте — относительное имя
        fileSize: fs.statSync(mp3Path).size,
      })
    }

    // SteamID неизменен → кешируем отдельным ключом (правило "player info не кешируем" не нарушаем)
    const rosterBase = collectRoster(match)
    const steamIds = await batchWithLimit(
      rosterBase.map(p => () =>
        withCache(`steamid:${p.playerId}`, async () => {
          const info = await getPlayerInfo(client, p.playerId)
          return info?.steam_id_64 ?? ""
        }),
      ),
      DEFAULT_CONCURRENCY,
    )
    const roster: RosterEntry[] = rosterBase.map((p, i) => ({
      ...p,
      steamId64: steamIds[i] || null,
    }))

    const manifest = buildVoiceManifest(matchId, roster, mp3Files)
    fs.writeFileSync(
      path.join(tmpDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf-8",
    )

    // Атомарная публикация: упавшая джоба не оставляет полукеша
    fs.renameSync(tmpDir, finalDir)
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    throw err
  } finally {
    if (demoDownloaded && !options.keepDemo) fs.rmSync(demoPath!, { force: true })
  }

  return loadVoiceManifest(matchId)!
}
```

В `core/index.ts` добавить секцию после use cases:

```ts
export {
  fetchMatchVoices,
  loadVoiceManifest,
  voiceMatchDir,
  voiceAudioPath,
  setVoiceStorageRoot,
} from "./usecases/voice"
export type { VoiceDeps, FetchMatchVoicesOptions } from "./usecases/voice"
export { parseMatchId } from "./voice/manifest"
```

- [ ] **Step 3: Тесты зелёные**

`npm test -w @faceit/core` → PASS (все файлы). `npm run typecheck:core` → чисто.

- [ ] **Step 4: Commit**

```bash
git add core/usecases/voice.ts core/index.ts core/__tests__/voice-usecase.test.ts
git commit -m "feat(core): usecase fetchMatchVoices — оркестрация, вечный кеш, атомарная публикация"
```

---

### Task 7: CLI-команда `npm run voice`

**Files:**
- Create: `cli/voice.ts`
- Modify: `package.json` (корневой — script `voice`)

**Interfaces:**
- Consumes: `fetchMatchVoices`, `parseMatchId`, `createFaceitClient`, `getFaceitApiKey` из `@faceit/core`.
- Produces: команда `npm run voice -- <matchId|url> [nickname] [--demo <path>] [--keep-demo]`.

- [ ] **Step 1: Реализация CLI**

Создать `cli/voice.ts`:

```ts
import {
  createFaceitClient,
  fetchMatchVoices,
  getFaceitApiKey,
  parseMatchId,
} from "@faceit/core"
import type { VoiceProgressStep } from "@faceit/core"

// Аргументы: <matchId|url> [nickname] [--demo <path>] [--keep-demo]
const args = process.argv.slice(2)
const flags = new Set<string>()
let demoPath: string | undefined
const positional: string[] = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--demo") demoPath = args[++i]
  else if (args[i].startsWith("--")) flags.add(args[i])
  else positional.push(args[i])
}
const MATCH_ARG = positional[0]
const NICKNAME = positional[1]

if (!MATCH_ARG) {
  console.error(
    "Использование: npm run voice -- <matchId|ссылка на матч> [nickname] [--demo <путь к .dem>] [--keep-demo]",
  )
  process.exit(1)
}

const client = createFaceitClient(getFaceitApiKey())

const STEP_LABELS: Record<VoiceProgressStep, string> = {
  download: "⬇️ Скачивание демки...",
  extract: "🔊 Извлечение голосов из демки (может занять минуты)...",
  transcode: "🎛️ Конвертация в MP3...",
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

async function main() {
  const matchId = parseMatchId(MATCH_ARG)
  console.log(`\n🎤 Извлечение голосов матча: ${matchId}`)

  const manifest = await fetchMatchVoices(client, matchId, {
    demoPath,
    keepDemo: flags.has("--keep-demo"),
    onProgress: step => console.log(STEP_LABELS[step]),
  })

  if (manifest.players.length === 0) {
    console.log("\n😶 Голоса не найдены (никто не говорил или демка без голосовых данных)")
    return
  }

  console.log(`\n✅ Готово! Игроков с голосом: ${manifest.players.length}\n`)
  console.table(
    manifest.players.map(p => ({
      Игрок: p.nickname + (NICKNAME && p.nickname.toLowerCase() === NICKNAME.toLowerCase() ? " ⭐" : ""),
      Команда: p.faction,
      Размер: formatSize(p.fileSize),
      Файл: p.filePath,
    })),
  )
}

main().catch(error => {
  console.error("Произошла ошибка:", error.message)
  process.exitCode = 1
})
```

В корневой `package.json` в `scripts` после `"smurfs"` добавить:

```json
"voice": "tsx cli/voice.ts",
```

- [ ] **Step 2: Проверка**

Запустить: `npm run voice` (без аргументов)
Ожидаемо: строка «Использование: …», exit code 1.

Запустить: `npm run typecheck:cli` → чисто.

(Полный прогон с реальным матчем — Task 11, требует токен.)

- [ ] **Step 3: Commit**

```bash
git add cli/voice.ts package.json
git commit -m "feat(cli): команда voice — извлечение голосов матча в MP3"
```

---

### Task 8: Server — voice.service + voice.routes + mount

**Files:**
- Create: `server/src/services/voice.service.ts`
- Create: `server/src/routes/voice.routes.ts`
- Modify: `server/src/index.ts` (mount + предупреждение о токене)

**Interfaces:**
- Consumes: `fetchMatchVoices`, `loadVoiceManifest`, `voiceAudioPath` из `@faceit/core`; типы `VoiceManifest`, `VoiceStatusDto`, `VoicePlayerDto`, `VoiceProgressStep`; `AppError` (`server/src/lib/errors.ts`).
- Produces: `startVoiceExtraction(client: FaceitClient, matchId: string): VoiceStatusDto`; `getVoiceStatus(matchId: string): VoiceStatusDto`; `getVoiceFilePath(matchId: string, fileName: string): string`; роуты `POST /api/match/:matchId/voices`, `GET /api/match/:matchId/voices`, `GET /api/match/:matchId/voices/:file`. Web (Task 9) полагается на форму `VoiceStatusDto` и `url` вида `/api/match/{matchId}/voices/{steamId64}.mp3`.

- [ ] **Step 1: Сервис**

Создать `server/src/services/voice.service.ts`:

```ts
import fs from "fs"
import {
  fetchMatchVoices,
  loadVoiceManifest,
  voiceAudioPath,
} from "@faceit/core"
import type {
  FaceitClient,
  VoiceManifest,
  VoicePlayerDto,
  VoiceProgressStep,
  VoiceStatusDto,
} from "@faceit/core"
import { AppError } from "../lib/errors"

interface VoiceJob {
  status: "pending" | "extracting" | "done" | "error"
  step?: VoiceProgressStep
  manifest?: VoiceManifest
  error?: string
}

// In-memory джобы: теряются при рестарте, но готовые MP3 остаются в кеше
const jobs = new Map<string, VoiceJob>()

const MATCH_ID_RE = /^[0-9a-zA-Z-]{5,100}$/

function assertMatchId(matchId: string): void {
  if (!MATCH_ID_RE.test(matchId)) throw AppError.badRequest("Некорректный matchId")
}

function toDto(matchId: string, manifest: VoiceManifest): VoicePlayerDto[] {
  return manifest.players.map(p => ({
    playerId: p.playerId,
    nickname: p.nickname,
    steamId64: p.steamId64,
    faction: p.faction,
    fileSize: p.fileSize,
    url: `/api/match/${matchId}/voices/${p.steamId64}.mp3`,
  }))
}

/** Статус: none | pending | extracting | done | error (учитывает дисковый кеш) */
export function getVoiceStatus(matchId: string): VoiceStatusDto {
  assertMatchId(matchId)
  const job = jobs.get(matchId)
  if (job) {
    return {
      status: job.status,
      step: job.step,
      players: job.manifest ? toDto(matchId, job.manifest) : undefined,
      error: job.error,
    }
  }
  const cached = loadVoiceManifest(matchId)
  if (cached) return { status: "done", players: toDto(matchId, cached) }
  return { status: "none" }
}

/** Запуск извлечения (дедуп по matchId; кеш-хит → сразу done) */
export function startVoiceExtraction(client: FaceitClient, matchId: string): VoiceStatusDto {
  assertMatchId(matchId)
  const existing = jobs.get(matchId)
  if (existing && existing.status !== "error") return getVoiceStatus(matchId)
  if (loadVoiceManifest(matchId)) return getVoiceStatus(matchId)

  const job: VoiceJob = { status: "pending" }
  jobs.set(matchId, job)

  fetchMatchVoices(client, matchId, {
    onProgress: step => {
      job.status = "extracting"
      job.step = step
    },
  })
    .then(manifest => {
      job.status = "done"
      job.step = undefined
      job.manifest = manifest
    })
    .catch((err: any) => {
      job.status = "error"
      job.step = undefined
      job.error =
        err?.code === "DEMO_NOT_AVAILABLE"
          ? "Демка недоступна — FACEIT хранит демки ограниченное время"
          : err?.status === 401 || err?.status === 403
            ? "FACEIT отклонил сессионный токен — обновите FACEIT_SESSION_TOKEN в .env"
            : err?.message ?? "Неизвестная ошибка"
      console.error(`[voice] Ошибка извлечения ${matchId}:`, err?.message ?? err)
    })

  return { status: "pending" }
}

/** Абсолютный путь к mp3 для res.sendFile; валидация имени — защита от path traversal */
export function getVoiceFilePath(matchId: string, fileName: string): string {
  assertMatchId(matchId)
  if (!/^\d{17}\.mp3$/.test(fileName)) throw AppError.badRequest("Некорректное имя файла")
  const filePath = voiceAudioPath(matchId, fileName.replace(/\.mp3$/, ""))
  if (!fs.existsSync(filePath)) throw AppError.notFound("Аудиофайл не найден")
  return filePath
}
```

- [ ] **Step 2: Роутер и mount**

Создать `server/src/routes/voice.routes.ts`:

```ts
import { Router } from "express"
import type { AppContext } from "../bootstrap"
import {
  getVoiceFilePath,
  getVoiceStatus,
  startVoiceExtraction,
} from "../services/voice.service"

export function createVoiceRouter(ctx: AppContext): Router {
  const router = Router()

  // POST /api/match/:matchId/voices — старт извлечения голосов
  router.post("/:matchId/voices", (req, res, next) => {
    try {
      res.status(202).json(startVoiceExtraction(ctx.client, req.params.matchId))
    } catch (err) {
      next(err)
    }
  })

  // GET /api/match/:matchId/voices — статус джобы + список аудио
  router.get("/:matchId/voices", (req, res, next) => {
    try {
      res.json(getVoiceStatus(req.params.matchId))
    } catch (err) {
      next(err)
    }
  })

  // GET /api/match/:matchId/voices/:file — mp3 (sendFile: Content-Type + Range для перемотки)
  router.get("/:matchId/voices/:file", (req, res, next) => {
    try {
      res.sendFile(getVoiceFilePath(req.params.matchId, req.params.file))
    } catch (err) {
      next(err)
    }
  })

  return router
}
```

В `server/src/index.ts`:
- добавить импорт `import { createVoiceRouter } from "./routes/voice.routes"`;
- после строки `app.use("/api/team", createTeamRouter(ctx))` добавить `app.use("/api/match", createVoiceRouter(ctx))`;
- в callback `app.listen` после предупреждения о `FACEIT_API_KEY` добавить:

```ts
  if (!process.env.FACEIT_SESSION_TOKEN) {
    console.warn("⚠ FACEIT_SESSION_TOKEN не задан в .env — извлечение голосов из демок не будет работать")
  }
```

- [ ] **Step 3: Проверка без токена**

Запустить: `npm run typecheck:server` → чисто.

Запустить сервер `npm run dev:server` и в соседнем терминале:

```bash
curl -s http://127.0.0.1:3000/api/match/1-unknown-match/voices
```
Ожидаемо: `{"status":"none"}`.

```bash
curl -s http://127.0.0.1:3000/api/match/%2e%2e%2f/voices
```
Ожидаемо: `{"error":"Некорректный matchId","code":"BAD_REQUEST"}` (HTTP 400).

```bash
curl -s http://127.0.0.1:3000/api/match/1-unknown-match/voices/123.mp3
```
Ожидаемо: HTTP 400 «Некорректное имя файла». Остановить сервер.

- [ ] **Step 4: Commit**

```bash
git add server/src/services/voice.service.ts server/src/routes/voice.routes.ts server/src/index.ts
git commit -m "feat(server): джобы извлечения голосов + роуты статуса и отдачи mp3"
```

---

### Task 9: Web — endpoints, useMatchVoices, VoicePanel

**Files:**
- Create: `web/src/features/voice/model/useMatchVoices.ts`
- Create: `web/src/features/voice/ui/VoicePanel.tsx`
- Modify: `web/src/shared/api/endpoints.ts`
- Modify: `web/src/shared/types/index.ts`
- Test: `web/src/__tests__/VoicePanel.test.tsx`

**Interfaces:**
- Consumes: `VoiceStatusDto`, `VoicePlayerDto`, `VoiceProgressStep` из `@faceit/core` (через `@/shared/types`); `apiFetch`; серверные роуты из Task 8.
- Produces: `startVoiceExtraction(matchId): Promise<VoiceStatusDto>`, `getVoiceStatus(matchId): Promise<VoiceStatusDto>` (endpoints); хуки `useVoiceStatus(matchId: string)`, `useStartVoiceExtraction(matchId: string)`; компонент `VoicePanel({ matchId, highlightNickname? })` — Task 10 встраивает его в таб «Матчи».

- [ ] **Step 1: Типы и endpoints**

В `web/src/shared/types/index.ts` в export-список из `@faceit/core` добавить: `VoiceStatusDto`, `VoicePlayerDto`, `VoiceProgressStep`.

В `web/src/shared/api/endpoints.ts` добавить импорт типа и две функции:

```ts
import type { VoiceStatusDto } from "@faceit/core"

/** Запуск извлечения голосов матча */
export async function startVoiceExtraction(matchId: string): Promise<VoiceStatusDto> {
  return apiFetch<VoiceStatusDto>(
    `/api/match/${encodeURIComponent(matchId)}/voices`,
    { method: "POST" },
  )
}

/** Статус извлечения голосов + список аудио */
export async function getVoiceStatus(matchId: string): Promise<VoiceStatusDto> {
  return apiFetch<VoiceStatusDto>(`/api/match/${encodeURIComponent(matchId)}/voices`)
}
```

- [ ] **Step 2: Failing-тест VoicePanel**

Создать `web/src/__tests__/VoicePanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { VoicePanel } from "@/features/voice/ui/VoicePanel"
import * as endpoints from "@/shared/api/endpoints"
import type { VoiceStatusDto } from "@/shared/types"

vi.mock("@/shared/api/endpoints", async importOriginal => ({
  ...(await importOriginal<typeof endpoints>()),
  getVoiceStatus: vi.fn(),
  startVoiceExtraction: vi.fn(),
}))

const mockedGet = vi.mocked(endpoints.getVoiceStatus)
const mockedStart = vi.mocked(endpoints.startVoiceExtraction)

function renderPanel(props: Partial<Parameters<typeof VoicePanel>[0]> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <VoicePanel matchId="1-m" {...props} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("VoicePanel", () => {
  it("status none → кнопка запуска, клик стартует извлечение", async () => {
    mockedGet.mockResolvedValue({ status: "none" })
    mockedStart.mockResolvedValue({ status: "pending" })
    renderPanel()

    const button = await screen.findByRole("button", { name: /Извлечь голоса/ })
    await userEvent.click(button)
    expect(mockedStart).toHaveBeenCalledWith("1-m")
  })

  it("status extracting → индикатор шага", async () => {
    mockedGet.mockResolvedValue({ status: "extracting", step: "extract" })
    renderPanel()
    expect(await screen.findByText(/Извлечение голосов/)).toBeInTheDocument()
  })

  it("status done → плееры по командам, целевой игрок подсвечен", async () => {
    const status: VoiceStatusDto = {
      status: "done",
      players: [
        { playerId: "p1", nickname: "Alpha", steamId64: "76561198000000001", faction: "faction1", fileSize: 1000, url: "/api/match/1-m/voices/76561198000000001.mp3" },
        { playerId: "p2", nickname: "Bravo", steamId64: "76561198000000002", faction: "faction2", fileSize: 2000, url: "/api/match/1-m/voices/76561198000000002.mp3" },
      ],
    }
    mockedGet.mockResolvedValue(status)
    renderPanel({ highlightNickname: "alpha" })

    expect(await screen.findByText(/Alpha/)).toBeInTheDocument()
    expect(screen.getByText(/Bravo/)).toBeInTheDocument()
    expect(screen.getByText(/Alpha/).textContent).toContain("⭐")
  })

  it("status done без игроков → «Голоса не найдены»", async () => {
    mockedGet.mockResolvedValue({ status: "done", players: [] })
    renderPanel()
    expect(await screen.findByText(/Голоса не найдены/)).toBeInTheDocument()
  })

  it("status error → сообщение и кнопка «Повторить»", async () => {
    mockedGet.mockResolvedValue({ status: "error", error: "Демка недоступна" })
    renderPanel()
    expect(await screen.findByText(/Демка недоступна/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Повторить/ })).toBeInTheDocument()
  })
})
```

Запустить: `npm test -w @faceit/web -- --run VoicePanel`
Ожидаемо: FAIL — `VoicePanel` не существует.

- [ ] **Step 3: Хук и компонент**

Создать `web/src/features/voice/model/useMatchVoices.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { VoiceStatusDto } from "@/shared/types"
import { getVoiceStatus, startVoiceExtraction } from "@/shared/api/endpoints"

const queryKey = (matchId: string) => ["voices", matchId]

const ACTIVE_STATUSES = new Set(["pending", "extracting"])

/** Статус голосов матча: поллинг каждые 2с, пока идёт извлечение */
export function useVoiceStatus(matchId: string) {
  return useQuery<VoiceStatusDto>({
    queryKey: queryKey(matchId),
    queryFn: () => getVoiceStatus(matchId),
    refetchInterval: query =>
      query.state.data && ACTIVE_STATUSES.has(query.state.data.status) ? 2000 : false,
  })
}

/** Мутация запуска извлечения: ответ сразу кладётся в кеш статуса */
export function useStartVoiceExtraction(matchId: string) {
  const qc = useQueryClient()
  return useMutation<VoiceStatusDto, Error>({
    mutationFn: () => startVoiceExtraction(matchId),
    onSuccess: data => qc.setQueryData(queryKey(matchId), data),
  })
}
```

Создать `web/src/features/voice/ui/VoicePanel.tsx`:

```tsx
import type { VoicePlayerDto, VoiceProgressStep } from "@/shared/types"
import { useStartVoiceExtraction, useVoiceStatus } from "../model/useMatchVoices"

const STEP_LABELS: Record<VoiceProgressStep, string> = {
  download: "Скачивание демки...",
  extract: "Извлечение голосов...",
  transcode: "Конвертация в MP3...",
}

const btnClass =
  "cursor-pointer px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 " +
  "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"

function InlineSpinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
  )
}

function PlayerAudio({ player, highlight }: { player: VoicePlayerDto; highlight: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1.5">
      <span
        className={`text-sm w-full sm:w-40 truncate ${
          highlight ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"
        }`}
      >
        {player.nickname}{highlight ? " ⭐" : ""}
      </span>
      <audio controls preload="none" src={player.url} className="w-full sm:flex-1 h-8" />
    </div>
  )
}

interface VoicePanelProps {
  matchId: string
  /** Ник целевого игрока (страница игрока) — подсвечивается в списке */
  highlightNickname?: string
}

export function VoicePanel({ matchId, highlightNickname }: VoicePanelProps) {
  const { data, isLoading, error } = useVoiceStatus(matchId)
  const start = useStartVoiceExtraction(matchId)

  if (isLoading) {
    return (
      <div className="py-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <InlineSpinner /> <span>Проверка статуса...</span>
      </div>
    )
  }
  if (error) return <p className="py-3 text-sm text-red-500">Ошибка: {error.message}</p>

  const status = data?.status ?? "none"

  if (status === "none") {
    return (
      <div className="py-3">
        <button onClick={() => start.mutate()} disabled={start.isPending} className={btnClass}>
          🎤 Извлечь голоса из демки
        </button>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Скачает демку и достанет голосовой чат — займёт несколько минут
        </p>
      </div>
    )
  }

  if (status === "pending" || status === "extracting") {
    return (
      <div className="py-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <InlineSpinner />
        <span>{(data?.step && STEP_LABELS[data.step]) || "В очереди..."}</span>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="py-3">
        <p className="text-sm text-red-500 mb-2">{data?.error ?? "Ошибка извлечения"}</p>
        <button onClick={() => start.mutate()} className={btnClass}>Повторить</button>
      </div>
    )
  }

  const players = data?.players ?? []
  if (players.length === 0) {
    return (
      <p className="py-3 text-sm text-gray-500 dark:text-gray-400">
        😶 Голоса не найдены — в демке нет голосовых данных
      </p>
    )
  }

  const factions = [
    { key: "faction1" as const, label: "Команда 1" },
    { key: "faction2" as const, label: "Команда 2" },
  ]

  return (
    <div className="py-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
      {factions.map(({ key, label }) => {
        const list = players.filter(p => p.faction === key)
        if (list.length === 0) return null
        return (
          <div key={key}>
            <h4 className="text-[11px] uppercase text-gray-400 dark:text-gray-500 mb-1">{label}</h4>
            {list.map(p => (
              <PlayerAudio
                key={p.steamId64}
                player={p}
                highlight={!!highlightNickname && p.nickname.toLowerCase() === highlightNickname.toLowerCase()}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Тесты и typecheck зелёные**

`npm test -w @faceit/web -- --run VoicePanel` → PASS (5 тестов).
`npm run typecheck:web` → чисто.

- [ ] **Step 5: Commit**

```bash
git add web/src/features/voice web/src/shared/api/endpoints.ts web/src/shared/types/index.ts web/src/__tests__/VoicePanel.test.tsx
git commit -m "feat(web): фича voice — поллинг статуса и панель аудиоплееров"
```

---

### Task 10: Интеграция VoicePanel в таб «Матчи»

**Files:**
- Modify: `web/src/features/report/tabs/MatchHistoryTab.tsx`
- Test: `web/src/__tests__/MatchHistoryTab.voice.test.tsx`

**Interfaces:**
- Consumes: `VoicePanel` (Task 9); существующие `MatchRecord.matchId`, `PlayerDropPickStats.playerProfile?.nickname`.
- Produces: колонка 🎤 в таблице матчей; клик раскрывает под строкой `VoicePanel`.

- [ ] **Step 1: Failing-тест**

Создать `web/src/__tests__/MatchHistoryTab.voice.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MatchHistoryTab } from "@/features/report/tabs/MatchHistoryTab"
import * as endpoints from "@/shared/api/endpoints"
import type { PlayerDropPickStats } from "@/shared/types"

vi.mock("@/shared/api/endpoints", async importOriginal => ({
  ...(await importOriginal<typeof endpoints>()),
  getVoiceStatus: vi.fn().mockResolvedValue({ status: "none" }),
  startVoiceExtraction: vi.fn(),
}))

// Минимальный stats: один матч на одной карте (остальные поля таб не читает)
const stats = {
  leaderMapWinRate: {},
  matchRecords: {
    de_mirage: [
      {
        matchId: "1-m",
        date: 1700000000,
        faceitUrl: "https://faceit.com/room/1-m",
        won: true,
        mapScore: "13:7",
        bestOf: 1,
        opponentName: "Foes",
      },
    ],
  },
} as unknown as PlayerDropPickStats

describe("MatchHistoryTab — интеграция голосов", () => {
  it("клик по 🎤 раскрывает VoicePanel", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <MatchHistoryTab stats={stats} isDark={false} />
      </QueryClientProvider>,
    )

    await userEvent.click(screen.getByRole("button", { name: "🎤" }))
    expect(await screen.findByText(/Извлечь голоса/)).toBeInTheDocument()
  })
})
```

Запустить: `npm test -w @faceit/web -- --run MatchHistoryTab.voice`
Ожидаемо: FAIL — кнопки 🎤 нет.

- [ ] **Step 2: Интеграция**

В `web/src/features/report/tabs/MatchHistoryTab.tsx`:

1. Импорт: `import { VoicePanel } from "@/features/voice/ui/VoicePanel"` (композиция report → voice разрешена).
2. Состояние рядом с `expandedMatchId`:

```tsx
const [voiceMatchId, setVoiceMatchId] = useState<string | null>(null)
```

3. Ник целевого игрока (после `const useLeaderData = ...`):

```tsx
const highlightNickname = isPlayerStats(stats) ? stats.playerProfile?.nickname : undefined
```

4. В `<thead>` после колонки «Турнир» (до блока `hasStats`) добавить:

```tsx
<th className="text-center font-medium px-2 py-1 w-[36px]" title="Голоса из демки">🎤</th>
```

5. В строке таблицы после ячейки «Турнир» (до блока `hasStats`) добавить:

```tsx
<td className="px-2 py-1.5 text-center">
  <button
    onClick={e => {
      e.stopPropagation()
      setVoiceMatchId(voiceMatchId === r.matchId ? null : r.matchId)
    }}
    title="Голоса из демки"
    aria-label="🎤"
    className={`cursor-pointer transition-colors ${
      voiceMatchId === r.matchId ? "text-blue-500" : "text-gray-400 hover:text-blue-500"
    }`}
  >
    🎤
  </button>
</td>
```

6. Общее число колонок выросло на 1 — заменить существующий `colSpan={hasStats ? 8 : 5}` у `MatchDetailCard` на `colSpan={hasStats ? 9 : 6}` и после блока `expandedMatchId === r.matchId` добавить:

```tsx
{voiceMatchId === r.matchId && (
  <tr>
    <td colSpan={hasStats ? 9 : 6} className="px-3 py-0 bg-gray-50 dark:bg-gray-800/40">
      <VoicePanel matchId={r.matchId} highlightNickname={highlightNickname} />
    </td>
  </tr>
)}
```

- [ ] **Step 3: Тесты и typecheck зелёные**

`npm test -w @faceit/web -- --run` → PASS (все web-тесты, включая существующие).
`npm run typecheck:web` → чисто.

- [ ] **Step 4: Commit**

```bash
git add web/src/features/report/tabs/MatchHistoryTab.tsx web/src/__tests__/MatchHistoryTab.voice.test.tsx
git commit -m "feat(web): кнопка 🎤 в табе «Матчи» — прослушивание голосов матча"
```

---

### Task 11: Финальная верификация + документация

**Files:**
- Modify: `CLAUDE.md` (script voice + структура core/voice + env-переменная)

**Interfaces:**
- Consumes: всё выше.

- [ ] **Step 1: Все проверки**

```bash
npm run typecheck
npm test -w @faceit/core
npm test -w @faceit/web -- --run
```
Ожидаемо: везде PASS/чисто.

- [ ] **Step 2: Интеграционный прогон (требует FACEIT_SESSION_TOKEN в .env)**

Взять свежий матч (например, из истории любого активного игрока) и выполнить:

```bash
npm run voice -- <ссылка на match room>
```

Ожидаемо: скачивание csgove (первый раз), скачивание демки, таблица игроков с MP3-файлами в `.cache/voices/{matchId}/`. Прослушать один файл руками. Затем повторить команду — мгновенный ответ из кеша. Затем поднять `npm run dev:server` + `npm run dev:web`, открыть страницу игрока → таб «Матчи» → 🎤 на том же матче: статус `done` сразу (кеш), плееры играют. Если внутренний эндпоинт вернул 404 — поправить `FACEIT_DOWNLOAD_API_URL` по DevTools (см. Task 3 Step 1) и повторить.

Проверить мобильную ширину и тёмную тему панели (DevTools → responsive + переключатель темы).

- [ ] **Step 3: Обновить CLAUDE.md**

В секцию «Running Scripts» добавить строку:

```
npm run voice -- "<matchId|url>"      # извлечь голоса игроков матча в MP3 (.cache/voices/)
```

В описание структуры `core/` добавить подраздел:

```
  voice/               # извлечение голосов из демок: binary (csgove), demo (скачивание), 
                       # runner/extract/transcode, manifest; usecases/voice.ts — fetchMatchVoices
```

В секцию env/ключей добавить: `FACEIT_SESSION_TOKEN` — сессионный Bearer-токен faceit.com для скачивания демок (внутренний download-url эндпоинт; официальный Downloads API требует отдельной заявки).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): голосовая фича — script voice, структура core/voice, FACEIT_SESSION_TOKEN"
```
