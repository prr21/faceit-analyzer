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
