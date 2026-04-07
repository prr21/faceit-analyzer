import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import type { TeamDropPickStats, PlayerDropPickStats } from "@faceit/core"

const TEMPLATE_PATH = resolve("web", "dist", "index.html")

function injectData(type: "team" | "player", name: string, stats: TeamDropPickStats | PlayerDropPickStats): string {
  const template = readFileSync(TEMPLATE_PATH, "utf-8")
  const reportData = JSON.stringify({ type, name, stats })
  const script = `<script>window.__REPORT_DATA__=${reportData}</script>`
  return template.replace("</head>", `${script}\n</head>`)
}

export function writeTeamReport(outputPath: string, teamName: string, stats: TeamDropPickStats): void {
  const html = injectData("team", teamName, stats)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, html, "utf-8")
}

export function writePlayerReport(outputPath: string, nickname: string, stats: PlayerDropPickStats): void {
  const html = injectData("player", nickname, stats)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, html, "utf-8")
}
