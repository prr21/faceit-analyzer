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
