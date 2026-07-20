import { Link } from "react-router-dom"
import { teamPath } from "@/shared/routing/paths"
import type { MatchAnalysisResult, MatchTeamAnalysis } from "@/shared/types"

function TeamTitle({ team }: { team: MatchTeamAnalysis }) {
  const title = (
    <div className="min-w-0">
      <div className="text-lg sm:text-xl font-bold truncate">{team.name}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">avg ELO {team.avgElo}</div>
    </div>
  )
  if (!team.factionId) return title
  return (
    <Link to={teamPath(team.factionId)} className="hover:opacity-80 transition-opacity">
      {title}
    </Link>
  )
}

export function MatchHeader({ data }: { data: MatchAnalysisResult }) {
  const [a, b] = data.teams
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between gap-3">
        <TeamTitle team={a} />
        <div className="text-center shrink-0">
          <div className="text-sm font-semibold text-gray-400 dark:text-gray-500">VS</div>
          {data.bestOf && (
            <div className="text-[11px] text-gray-400 dark:text-gray-500">BO{data.bestOf}</div>
          )}
        </div>
        <div className="text-right">
          <TeamTitle team={b} />
        </div>
      </div>
      {(data.competitionName || data.faceitUrl) && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{data.competitionName}</span>
          {data.faceitUrl && (
            <a
              href={data.faceitUrl.replace("{lang}", "ru")}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              Открыть на FACEIT ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}
