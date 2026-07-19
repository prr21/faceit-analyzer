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
