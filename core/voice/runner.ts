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
