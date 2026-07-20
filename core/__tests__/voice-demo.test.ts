import fs from "fs"
import os from "os"
import path from "path"
import { gzipSync, zstdCompressSync } from "zlib"
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
    expect(captured.url).toBe("https://open.faceit.com/download/v2/demos/download")
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

  it("распаковывает .zst на лету", async () => {
    const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "demo-")), "m.dem")
    const zst = zstdCompressSync(Buffer.from("DEMO-BYTES"))
    const fetchFn = (async () => new Response(zst)) as typeof fetch

    await downloadDemo("https://signed.test/x.dem.zst", dest, fetchFn)
    expect(fs.readFileSync(dest, "utf-8")).toBe("DEMO-BYTES")
  })

  it("пишет как есть без .gz", async () => {
    const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "demo-")), "m.dem")
    const fetchFn = (async () => new Response(Buffer.from("RAW"))) as typeof fetch

    await downloadDemo("https://signed.test/x.dem", dest, fetchFn)
    expect(fs.readFileSync(dest, "utf-8")).toBe("RAW")
  })
})
