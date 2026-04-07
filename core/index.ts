// API
export { createFaceitClient } from "./api/client.js"
export {
  getPlayerId,
  getPlayerMatches,
  getAllPlayerMatches,
  getMatchInfo,
  getMatchStats,
  getPlayerInfo,
} from "./api/faceit-open.js"
export {
  getMatchVotingHistory,
  getMatchWithVoting,
} from "./api/faceit-internal.js"

// Utils
export { withCache, getCached, setCache } from "./utils/cache.js"
export { withRetry } from "./utils/retry.js"
export { batchWithLimit } from "./utils/concurrency.js"
export { uniqueByField, replaceLangPlaceholder } from "./utils/dedup.js"
export {
  findMapVotingTicket,
  isPoolMap,
  classifyVotingEntity,
  getDeciderRound,
  incrementMapCount,
} from "./utils/map-voting.js"
export type { VotingPhase } from "./utils/map-voting.js"
export {
  createEmptyFactionStats,
  createEmptyFavoriteUnderdog,
  trackWinRate,
  trackFavoriteUnderdog,
  trackCompetitionType,
  buildMatchRecord,
  addMatchRecord,
  getMonthKey,
  getOrCreateTrend,
  calcStreaks,
  fillEloChanges,
} from "./utils/match-stats.js"
export {
  writeTeamReport,
  writePlayerReport,
} from "./utils/report-writer.js"

// Config
export {
  FACEIT_API_KEY,
  DEFAULT_MATCH_LIMIT,
  DEFAULT_GAME,
  ACTIVE_MAP_POOL,
  DEFAULT_CONCURRENCY,
  teams,
} from "./config.js"

// Analysis
export {
  analyzePlayerMapStrategy,
  findPlayerFaction,
  isLeader,
} from "./analysis/player-strategy.js"
export type { MatchWithData } from "./analysis/player-strategy.js"
export {
  analyzeTeamMapStrategy,
  findTargetFaction,
} from "./analysis/team-strategy.js"
export {
  collectEnemyPlayers,
  filterSmurfs,
} from "./analysis/smurf-detection.js"
export type { SmurfDetectionResult } from "./analysis/smurf-detection.js"

// Types — re-export all
export type * from "./types/faceit.js"
