// Store — точка входа (по аналогии с routing/index.ts)

// Providers
export { StoreProvider } from "./providers"

// Zustand stores
export { useThemeStore } from "./slices/useThemeStore"
export { useUIStore } from "./slices/useUIStore"

// TanStack Query hooks
export { useEmbeddedReport } from "./queries/useEmbeddedReport"
export { usePlayerReport } from "./queries/usePlayerReport"
export { usePlayerSearch } from "./queries/usePlayerSearch"

// API types
export type { SearchResult } from "./api/player"
