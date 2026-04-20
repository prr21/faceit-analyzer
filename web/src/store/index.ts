// Store — точка входа (по аналогии с routing/index.ts)

// Providers
export { StoreProvider } from "./providers"

// Zustand stores
export { useThemeStore } from "./slices/useThemeStore"
export { useUIStore } from "./slices/useUIStore"

// TanStack Query hooks
export { useEmbeddedReport } from "./queries/useEmbeddedReport"
export { usePlayerReport } from "./queries/usePlayerReport"
export { useGlobalSearch } from "./queries/useGlobalSearch"
export { useTeamRoster } from "./queries/useTeamRoster"
export {
  useAnalyzeTeamMutation,
  useCachedTeamAnalysis,
} from "./queries/useTeamAnalysis"

// API types
export type {
  SearchPlayerResult,
  SearchTeamResult,
  TeamInfo,
  SearchAllResult,
} from "./api/player"
