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
