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
