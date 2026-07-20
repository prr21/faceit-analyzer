import type { MatchAnalysisResult, MatchTeamAnalysis } from "../usecases/match"
import type { TeamRecommendations } from "../types/recommendation"

function mapName(id: string): string {
  return id.replace("de_", "")
}

function fmtWinrates(team: MatchTeamAnalysis): string {
  const entries = Object.entries(team.stats.mapWinRate)
    .filter(([, wr]) => wr.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
  if (entries.length === 0) return "нет данных по картам"
  return entries.map(([m, wr]) => `${mapName(m)} ${Math.round(wr.rate)}% (${wr.total})`).join(", ")
}

function fmtRoster(team: MatchTeamAnalysis): string {
  return team.roster
    .map(p => {
      const top = p.mapStats
        .slice(0, 3)
        .map(ms => `${mapName(ms.map)} ${Math.round(ms.winRate)}%/${ms.matches}м`)
        .join(", ")
      return `  - ${p.nickname} (ур.${p.skillLevel}): ${top || "нет данных по картам"}`
    })
    .join("\n")
}

function fmtTeam(team: MatchTeamAnalysis, idx: number): string {
  return [
    `Команда ${idx}: ${team.name} — средний ELO ${team.avgElo}, матчей в истории ${team.stats.count}`,
    `  Винрейт по картам: ${fmtWinrates(team)}`,
    `  Ростер:`,
    fmtRoster(team),
  ].join("\n")
}

function fmtRecs(recs: TeamRecommendations): string {
  const top = (arr: TeamRecommendations["picks"]) =>
    arr
      .slice(0, 3)
      .map(r => `${mapName(r.map)} (${r.reason})`)
      .join("; ")
  const lowData = recs.lowData ? " [мало данных]" : ""
  return `${recs.teamName}${lowData}:\n    Пик: ${top(recs.picks)}\n    Бан: ${top(recs.bans)}`
}

/**
 * Компактный русскоязычный бриф матча для системного промпта AI.
 * Чистая функция — переиспользуется сервером и (в будущем) telegram-ботом.
 */
export function buildMatchAIContext(result: MatchAnalysisResult): string {
  const lines: string[] = []
  const header = `Матч${result.competitionName ? `: ${result.competitionName}` : ""}${
    result.bestOf ? ` (BO${result.bestOf})` : ""
  }`
  lines.push(header)
  result.teams.forEach((t, i) => lines.push(fmtTeam(t, i + 1)))

  const mapRecs = result.insights.find(i => i.type === "map-recommendations")
  if (mapRecs) {
    lines.push("Рекомендации скоринг-движка (пик/бан):")
    mapRecs.teams.forEach(r => lines.push(`  ${fmtRecs(r)}`))
  }

  return lines.join("\n")
}
