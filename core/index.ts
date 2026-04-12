// API
export { createFaceitClient } from "./api/client"
export type { FaceitClient } from "./api/client"
export {
  searchPlayers,
  getPlayerId,
  getPlayerMatches,
  getAllPlayerMatches,
  getMatchInfo,
  getMatchStats,
  getPlayerInfo,
} from "./api/faceit-open"
export type { SearchPlayerResult } from "./api/faceit-open"
export {
  getMatchVotingHistory,
  getMatchWithVoting,
} from "./api/faceit-internal"

// Infra
export { withCache, getCached, setCache, setCacheProvider } from "./infra/cache"
export type { CacheProvider } from "./infra/cache"
export { withRetry, setRetryLogger } from "./infra/retry"
export type { RetryLogger } from "./infra/retry"
export { batchWithLimit } from "./infra/concurrency"
export { uniqueByField, replaceLangPlaceholder } from "./infra/dedup"
export { formatTimestamp } from "./infra/date-format"

// Analysis helpers
export {
  findMapVotingTicket,
  isPoolMap,
  classifyVotingEntity,
  getDeciderRound,
} from "./analysis/helpers/map-voting"
export {
  trackWinRate,
  trackFavoriteUnderdog,
  trackCompetitionType,
  incrementMapCount,
} from "./analysis/helpers/trackers"
export {
  createEmptyFactionStats,
  createEmptyFavoriteUnderdog,
} from "./analysis/helpers/factories"
export { buildMatchRecord, addMatchRecord } from "./analysis/helpers/match-record"
export { getMonthKey, getOrCreateTrend } from "./analysis/helpers/trends"
export { calcStreaks } from "./analysis/helpers/streaks"
export { fillEloChanges } from "./analysis/helpers/elo-changes"

// Constants
export {
  DEFAULT_MATCH_LIMIT,
  DEFAULT_GAME,
  ACTIVE_MAP_POOL,
  DEFAULT_CONCURRENCY,
} from "./constants"

// Env
export { getFaceitApiKey } from "./env"

// Analysis
export {
  analyzePlayerMapStrategy,
  findPlayerFaction,
  isLeader,
} from "./analysis/player-strategy"
export {
  analyzeTeamMapStrategy,
  findTargetFaction,
} from "./analysis/team-strategy"
export {
  collectEnemyPlayers,
  filterSmurfs,
} from "./analysis/smurf-detection"
export type { SmurfDetectionResult } from "./analysis/smurf-detection"

// Use cases — high-level orchestration (CLI & server share these)
export { fetchAndAnalyzePlayer } from "./usecases/player"
export type { PlayerAnalysisResult } from "./usecases/player"
export { fetchAndAnalyzeTeam } from "./usecases/team"
export type { TeamAnalysisResult } from "./usecases/team"

// Types — re-export all
export type * from "./types/index"
