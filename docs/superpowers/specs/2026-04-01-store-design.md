# Store Architecture Design

## Summary

Scalable state management for FACEIT Reports web app using **Zustand** (client state) + **TanStack Query** (server state). Infrastructure is implemented; this spec covers the architecture decisions and integration plan.

## Problem

The app grew from static embedded reports (`window.__REPORT_DATA__`) to dynamic data loading (player search, per-player pages, comparison). Current approach (useState + props drilling + stub hooks) doesn't scale:

- `isDark` is passed as prop through 4 levels to every tab component
- `usePlayerData` is a hand-written stub reimplementing what TanStack Query provides out of the box
- No caching between page navigations (going back to a player re-fetches everything)
- No unified API layer or mock/real switching

## Architecture

### Technology Choice

| Layer | Library | Why |
|---|---|---|
| Client state | Zustand v5 | Minimal boilerplate (~1KB), no providers needed, works outside React |
| Server state | TanStack Query v5 | Cache, stale-while-revalidate, auto retry, devtools |

**Why two libraries instead of one:** Zustand excels at synchronous client state (theme, UI prefs). TanStack Query excels at async server state (fetching, caching, invalidation). Each does its job; no overlap.

**Why not Redux Toolkit:** Excessive boilerplate (slices, reducers, selectors) for a project of this size. RTK Query is comparable to TanStack Query but tied to Redux ecosystem.

**Why not Jotai/Recoil:** Atomic approach lacks structure — easy to turn into scattered atoms at scale. Zustand stores are self-contained units with clear boundaries.

### File Structure

```
web/src/store/
├── index.ts              # Barrel exports (pattern from routing/index.ts)
├── providers.tsx          # QueryClientProvider + ReactQueryDevtools
├── query-client.ts        # QueryClient configuration
├── api/
│   ├── client.ts          # Base fetch wrapper, IS_MOCK toggle
│   ├── mock.ts            # Mock data functions with artificial delay
│   └── player.ts          # Player API (fetchPlayerReport, searchPlayers)
├── queries/
│   ├── useEmbeddedReport.ts  # Wraps window.__REPORT_DATA__ in Query
│   ├── usePlayerReport.ts    # Dynamic player report loading
│   └── usePlayerSearch.ts    # Search with built-in debounce
└── slices/
    ├── useThemeStore.ts      # Theme (dark/light) with DOM sync
    └── useUIStore.ts         # UI preferences (comparison)
```

### Zustand Stores

#### useThemeStore

Replaces the `useTheme()` hook. Key difference: Zustand `subscribe()` handles DOM side-effects (classList, localStorage) outside React render cycle.

```typescript
interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
}
```

- **Init:** reads from localStorage, falls back to `prefers-color-scheme`
- **Side-effects:** `subscribe()` syncs `<html class="dark">` and localStorage on every change
- **Module-level init:** applies theme class immediately on import (no FOUC)

#### useUIStore

UI state that doesn't belong in URL params.

```typescript
interface UIState {
  compareNicknames: [string, string]
  setCompareNickname: (index: 0 | 1, value: string) => void
  clearCompare: () => void
}
```

Extensible — new UI state (filters, selected maps, etc.) added as new properties.

### TanStack Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min — reports don't change frequently
      gcTime: 30 * 60 * 1000,       // 30 min garbage collection
      retry: 1,                      // Single retry for transient errors
      refetchOnWindowFocus: false,   // Reports are static enough
    },
  },
})
```

### Query Hooks

#### useEmbeddedReport

For `ReportPage` — reads `window.__REPORT_DATA__` (or mock in DEV).

- `queryKey: ["embedded-report"]`
- `staleTime: Infinity` — embedded data never changes
- Returns `ReportData | null`

#### usePlayerReport(nickname)

For `PlayerPage` — fetches player report from API (or mock).

- `queryKey: ["player-report", nickname]`
- `enabled: !!nickname` — no fetch without nickname
- Uses `fetchPlayerReport()` from API layer

#### usePlayerSearch(query)

For `PlayerSearch` — searches with debounce.

- `queryKey: ["player-search", debouncedQuery]`
- `enabled: debouncedQuery.length >= 3` — min 3 chars
- `placeholderData: keepPreviousData` — shows previous results while typing
- Built-in debounce (300ms) via internal useState + useEffect

### API Layer

#### Mock/Real Switching

```typescript
// api/client.ts
export const IS_MOCK = import.meta.env.DEV && !import.meta.env.VITE_API_URL
```

- **DEV without VITE_API_URL:** mock functions with artificial delay (400ms)
- **DEV with VITE_API_URL:** real API calls to specified URL
- **Production:** real API calls to same origin

#### apiFetch Wrapper

Generic fetch wrapper that:
- Prepends API base URL
- Sets Content-Type: application/json
- Throws descriptive Error on non-ok responses (404 = "Не найдено", others = status code)

#### API Functions

```typescript
// api/player.ts
fetchPlayerReport(nickname: string): Promise<ReportData>
searchPlayers(query: string): Promise<SearchResult[]>
```

Each function checks `IS_MOCK` and delegates to mock or real implementation.

### Provider Setup

```tsx
// App.tsx
<StoreProvider>          // QueryClientProvider + DevTools
  <HashRouter>
    <AppRoutes />
  </HashRouter>
</StoreProvider>
```

Zustand stores don't need providers — they're module-level singletons.

## Integration Plan

### Phase 1: Replace useTheme with useThemeStore

**Files to change:**
- `components/ReportView.tsx` — use `useThemeStore()` instead of `useTheme()`, stop passing `isDark` to tabs
- `components/Layout.tsx` — use `useThemeStore()` internally, remove `isDark`/`onToggleTheme` props
- `components/ThemeToggle.tsx` — use `useThemeStore()` internally, remove `isDark`/`onToggle` props
- `pages/SearchPage.tsx` — use `useThemeStore()` instead of `useTheme()`
- All tab components (`BanPickTab`, `WinrateTab`, `TrendsTab`, `MatchHistoryTab`, `OverviewTab`, `RadarTab`) — use `useThemeStore()` directly instead of receiving `isDark` prop
- Chart components that receive `isDark` — use `useThemeStore()` directly

**Approach:** Incremental — first make `useThemeStore` the source of truth in `ReportView`, then remove `isDark` prop from tabs one by one. Don't change all 17+ files in one commit.

**Result:** Remove `isDark` prop drilling from ReportView → tabs entirely.

### Phase 2: Replace embedded data reading with useEmbeddedReport

**Files to change:**
- `pages/ReportPage.tsx` — replace `getEmbeddedData()` with `useEmbeddedReport()`

**Result:** Embedded data goes through the same TanStack Query layer as everything else.

### Phase 3: Replace usePlayerData stub with usePlayerReport

**Files to change:**
- `pages/PlayerPage.tsx` — replace `usePlayerData()` with `usePlayerReport()`
- Can delete or gut `features/theme-4-async/hooks/usePlayerData.ts` (stub)

**Result:** Player page loads data through TanStack Query with caching, retry, and proper loading/error states.

### Phase 4: Wire up PlayerSearch with usePlayerSearch

**Files to change:**
- `features/theme-4-async/ui/PlayerSearch.tsx` — use `usePlayerSearch()` from store, remove local `SearchResult` type (use from `store/api/player`)
- Can delete `features/theme-4-async/hooks/useDebounce.ts` (replaced by built-in debounce in query hook)

**Result:** Search works with mock data now; switch to real API by setting VITE_API_URL.

### Phase 5: Wire up CompareTab with useUIStore

**Files to change:**
- `features/theme-5-dynamic/tabs/CompareTab.tsx` — replace local `useState` for nicknames with `useUIStore`, use `usePlayerReport` for loading comparison data

**Result:** Comparison state persists across tab switches; data loading uses the same caching layer.

### Phase 6: TeamPage — document future dynamic loading

**Files to change:**
- `pages/TeamPage.tsx` — add a TODO/comment noting that when `store/api/team.ts` and `store/queries/useTeamReport.ts` are created, TeamPage should switch from `window.__REPORT_DATA__` to `useTeamReport()`

**Not implemented now** — team API endpoints don't exist yet. But the scalability pattern ("Adding New Entity Type") in this spec covers the recipe.

### Phase 7: Fix mock.ts type assertion

**Files to change:**

- `store/api/mock.ts` — replace inline type literal cast with `PlayerDropPickStats` import

**Result:** Cleaner, type-safe mock that uses existing `PlayerProfile` interface.

### Phase 8: Clean up old hooks

**Files to delete or simplify:**
- `hooks/useTheme.ts` — replaced by `store/slices/useThemeStore.ts`
- `features/theme-4-async/hooks/usePlayerData.ts` — replaced by `store/queries/usePlayerReport.ts`
- `features/theme-4-async/hooks/useDebounce.ts` — replaced by debounce in `usePlayerSearch`

## Scalability Patterns

### Adding a New API Query

1. Add fetch function in `store/api/` (+ mock in `mock.ts`)
2. Create query hook in `store/queries/`
3. Export from `store/index.ts`
4. Use in component

### Adding New Client State

1. Create slice in `store/slices/`
2. Export from `store/index.ts`
3. Use in component (no provider changes needed)

### Adding New Entity Type (e.g., Team API)

1. Add `store/api/team.ts` with `fetchTeamReport()` + mock
2. Add `store/queries/useTeamReport.ts`
3. Update `pages/TeamPage.tsx` to use `useTeamReport()`
4. Export from `store/index.ts`

## What Stays as URL State

- **Report mode** (`?mode=leader|all`) — stays in URL search params (bookmarkable, shareable)
- **Active tab** (`:tab` route param) — stays in URL (bookmarkable)
- **Player nickname** (`:nickname` route param) — stays in URL

**Rule:** If it should survive a page refresh or be shareable via link → URL. Otherwise → Zustand.

## Notes & Caveats

- **Data immutability:** `useEmbeddedReport` returns a direct reference to `window.__REPORT_DATA__`. Consumers must treat it as read-only — mutating in-place (e.g. sorting an array) would corrupt the global object. TanStack Query expects immutable data.
- **Query key factory:** With 3 queries, inline string arrays are fine. If the number grows, consider a key factory pattern for easier invalidation:

  ```typescript
  export const playerKeys = {
    all: ["player"] as const,
    report: (nickname: string) => ["player-report", nickname] as const,
    search: (query: string) => ["player-search", query] as const,
  }
  ```

- **`useEmbeddedReport` returns `ReportData | null`** while `usePlayerReport` returns `ReportData`. Consumers must handle the `null` case for embedded data (data may genuinely not exist).
- **Education TODOs:** The integration plan replaces stub hooks that contain educational comments (usePlayerData, useDebounce). The store migration supersedes these exercises — the educational value shifts from "implement fetch manually" to "use TanStack Query patterns."

## Testing Strategy

- Zustand stores: test with `getState()` / `setState()` directly (no React needed)
- Query hooks: test with `@tanstack/react-query` test utilities + mock API layer
- Integration: existing component tests continue to work (mock data path unchanged)
