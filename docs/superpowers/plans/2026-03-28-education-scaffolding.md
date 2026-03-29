# Education Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create skeleton files with `// TODO:` comments for 10 student assignments, so students find pre-built scaffolding and fill in the logic.

**Architecture:** Each assignment gets skeleton component/hook/test files with empty function bodies, clear TODO instructions, and references to analogous working code. The existing app continues to work — new code is either behind feature flags or in separate files. Students fill in TODO blocks to make new features functional.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, ECharts 5, Vitest, React Testing Library, Express.js

---

## File Structure Overview

```
web/src/
├── components/
│   ├── tabs/
│   │   ├── RadarTab.tsx                 # 13.1 — Radar chart tab (skeleton)
│   │   └── CompareTab.tsx               # 14.1 — Compare two players (skeleton)
│   ├── charts/
│   │   └── RadarChart.tsx               # 13.1 — ECharts radar config (skeleton)
│   ├── ui/
│   │   ├── MatchDetailCard.tsx          # 13.2 — Expandable match detail card (skeleton)
│   │   ├── BestWorstCards.tsx           # 13.3 — Best/Worst results block (skeleton)
│   │   ├── PlayerSearch.tsx             # 6.2 — Search with debounce (skeleton)
│   │   ├── CompareView.tsx              # 14.1 — Side-by-side comparison (skeleton)
│   │   ├── RefreshIndicator.tsx         # 14.2 — Auto-refresh indicator (skeleton)
│   │   ├── LoadingSpinner.tsx           # 6.1 — Loading state component (skeleton)
│   │   ├── ErrorMessage.tsx             # 6.1 — Error state component (skeleton)
│   │   ├── SkeletonCard.tsx             # 16.1 — Loading skeleton (skeleton)
│   │   ├── AnimatedCounter.tsx          # 16.1 — Animated number counter (skeleton)
│   │   ├── MapImage.tsx                 # 16.2 — Map thumbnail with fallback (skeleton)
│   │   └── StatIcon.tsx                 # 16.2 — SVG stat icons (skeleton)
│   └── Layout.tsx                       # Modified — add search bar slot
├── hooks/
│   ├── usePlayerData.ts                 # 6.1 — Dynamic data loading hook (skeleton)
│   ├── useDebounce.ts                   # 6.2 — Debounce hook (skeleton)
│   └── usePolling.ts                    # 14.2 — Auto-refresh polling hook (skeleton)
├── utils/
│   └── colors.ts                        # Existing — tested in 10.1
├── App.tsx                              # Modified — add RadarTab, CompareTab
├── main.tsx                             # Modified — support dynamic loading (6.1)
├── app.css                              # Modified — add animation keyframes (16.1)
└── types.ts                             # Existing — no changes needed
web/src/__tests__/
├── colors.test.ts                       # 10.1 — Unit tests for color utils (skeleton)
├── useTheme.test.ts                     # 10.1 — Unit tests for theme hook (skeleton)
├── App.integration.test.tsx             # 5.1 — Integration tests (skeleton)
└── fixtures/
    └── mockData.ts                      # 5.1/10.1 — Test fixture data
server/
├── package.json                         # 2.1 — Express server deps
├── tsconfig.json                        # 2.1 — TypeScript config
└── src/
    ├── index.ts                         # 2.1 — Server entry point (skeleton)
    ├── routes/
    │   └── api.ts                       # 2.1 — API routes (skeleton)
    └── middleware/
        ├── cors.ts                      # 2.1 — CORS middleware (skeleton)
        └── rateLimit.ts                 # 2.1 — Rate limiting (skeleton)
```

---

## Task 1: Radar Chart Tab (Assignment 13.1)

**Files:**
- Create: `web/src/components/charts/RadarChart.tsx`
- Create: `web/src/components/tabs/RadarTab.tsx`
- Modify: `web/src/echarts-setup.ts` — register RadarChart + RadarComponent
- Modify: `web/src/App.tsx` — append "Радар" tab at end of tab arrays

### Context for students

The app uses ECharts for all visualizations. See `web/src/components/charts/BanPickChart.tsx` for the pattern: import `ReactECharts`, build an `option` object, pass it to `<ReactECharts option={option} />`. The radar chart will aggregate per-map metrics (win rate, avg K/D, avg ADR, avg HS%) into a spider diagram where each axis is one metric and each map is a colored polygon.

Data lives in `stats.mapWinRate` (win rates) and `stats.matchRecords` (K/D/ADR/HS per match). The aggregation pattern is in the `computeMapPerformance` function in `web/src/components/ui/WinRateTable.tsx`.

- [ ] **Step 1: Register RadarChart in echarts-setup.ts**

Add `RadarChart` from `echarts/charts` and `RadarComponent` from `echarts/components` to the `echarts.use([...])` call in `web/src/echarts-setup.ts`. This is infrastructure — fully implemented, NOT a TODO for students.

- [ ] **Step 2: Create RadarChart.tsx skeleton**

Create `web/src/components/charts/RadarChart.tsx` with:
- Interface `RadarChartProps` accepting `mapWinRate`, `matchRecords`, `isDark`
- Empty `option` object with TODO comments for ECharts radar config
- Reference to ECharts radar docs and existing chart patterns

- [ ] **Step 3: Create RadarTab.tsx skeleton**

Create `web/src/components/tabs/RadarTab.tsx` with:
- Interface `RadarTabProps` matching other tabs (stats, mode, isDark)
- Data extraction logic (mode-dependent, same as WinrateTab)
- Placeholder rendering RadarChart with TODO for data aggregation

- [ ] **Step 4: Wire RadarTab into App.tsx**

Modify `web/src/App.tsx`:
- Import RadarTab
- **Append** "Радар" at the END of each tab array (TEAM_TABS, LEADER_TABS, ALL_TABS)
- Add render condition using the next sequential index: `activeTab === 5 + tabOffset`

**IMPORTANT:** New tabs MUST be appended at the end to preserve existing index arithmetic. Both Task 1 and Task 6 modify App.tsx — execute them sequentially, not in parallel.

- [ ] **Step 5: Verify app compiles**

Run: `cd web && npx tsc --noEmit`
Expected: no type errors (skeleton has valid types, TODO is in comments)

- [ ] **Step 6: Commit**

```bash
git add web/src/echarts-setup.ts web/src/components/charts/RadarChart.tsx web/src/components/tabs/RadarTab.tsx web/src/App.tsx
git commit -m "feat(education): scaffold 13.1 — RadarTab + RadarChart with TODO markers"
```

---

## Task 2: Expandable Match Detail Card (Assignment 13.2)

**Files:**
- Create: `web/src/components/ui/MatchDetailCard.tsx`
- Modify: `web/src/components/tabs/MatchHistoryTab.tsx` — add expand/collapse logic

### Context for students

The match history table already renders rows. The task is to add click-to-expand: clicking a row shows a detail card below it with ELO change, K/D comparison vs opponent average, and a FACEIT link. The expand/collapse pattern already exists in `WinRateTable.tsx` — see the `expandedMap` state, click handler on `<tr>`, and conditional render block.

- [ ] **Step 1: Create MatchDetailCard.tsx skeleton**

Create `web/src/components/ui/MatchDetailCard.tsx` with:
- Interface accepting a `MatchRecord` + `mapName`
- Styled container (bg, border, rounded — see `RecentPerformance.tsx:53` for pattern)
- TODO placeholders for: ELO change display, K/D comparison, external link button

- [ ] **Step 2: Modify MatchHistoryTab.tsx — add expand state and click handler**

Add to `MatchHistoryTab.tsx`:
- `useState<string | null>(null)` for expanded match ID (TODO for student)
- Click handler on `<tr>` that toggles expanded state (TODO for student)
- Conditional render of `<MatchDetailCard>` below expanded row (TODO for student)
- Import MatchDetailCard

- [ ] **Step 3: Verify app compiles**

Run: `cd web && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add web/src/components/ui/MatchDetailCard.tsx web/src/components/tabs/MatchHistoryTab.tsx
git commit -m "feat(education): scaffold 13.2 — MatchDetailCard + expandable rows with TODO markers"
```

---

## Task 3: Best/Worst Results Block (Assignment 13.3)

**Files:**
- Create: `web/src/components/ui/BestWorstCards.tsx`
- Modify: `web/src/components/tabs/OverviewTab.tsx` — integrate BestWorstCards

### Context for students

The overview tab uses `Card` component for metrics (see `SummaryCards.tsx`). Students need to iterate over `mapWinRate` and `matchRecords`, find best/worst maps by win rate, K/D, and ADR, then render them in Card components. The aggregation pattern is in the `computeMapPerformance` function in `WinRateTable.tsx`. Use `useMemo` to avoid recalculating on every render (pattern: the `filtered` memo in `MatchHistoryTab.tsx`).

- [ ] **Step 1: Create BestWorstCards.tsx skeleton**

Create `web/src/components/ui/BestWorstCards.tsx` with:
- Interface accepting `mapWinRate` and `matchRecords`
- `useMemo` blocks with TODO comments for finding:
  - Best map by win rate (min 3 games threshold)
  - Worst map by win rate (min 3 games)
  - Best map by avg K/D
  - Best map by avg ADR
- Render section using existing `Card` component with placeholder values

- [ ] **Step 2: Integrate into OverviewTab**

Add `<BestWorstCards>` to `OverviewTab.tsx` after SummaryCards, passing appropriate data.

- [ ] **Step 3: Verify app compiles**

Run: `cd web && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add web/src/components/ui/BestWorstCards.tsx web/src/components/tabs/OverviewTab.tsx
git commit -m "feat(education): scaffold 13.3 — BestWorstCards with TODO markers"
```

---

## Task 4: Dynamic Data Loading Hook (Assignment 6.1)

**Files:**
- Create: `web/src/hooks/usePlayerData.ts`
- Create: `web/src/components/ui/LoadingSpinner.tsx`
- Create: `web/src/components/ui/ErrorMessage.tsx`
- Modify: `web/src/main.tsx` — add dynamic loading path

### Context for students

Currently data is injected via `window.__REPORT_DATA__` (see `main.tsx:14`). Students will create a `usePlayerData(nickname)` hook that fetches from the API server (Task 2.1) instead. The hook follows the standard loading/error/data pattern. It uses `useEffect` for the fetch, `AbortController` for cleanup, and `useState` for state management. See `useTheme.ts` for the pattern of a custom hook with `useState` + `useEffect`.

- [ ] **Step 1: Create LoadingSpinner.tsx**

Create with styled spinner animation (Tailwind animate-spin) — fully implemented, no TODO.

- [ ] **Step 2: Create ErrorMessage.tsx**

Create with retry button and error text — fully implemented, no TODO.

- [ ] **Step 3: Create usePlayerData.ts skeleton**

Create `web/src/hooks/usePlayerData.ts` with:
- Interface `UsePlayerDataResult` with `data`, `loading`, `error` fields
- Function signature `usePlayerData(nickname: string): UsePlayerDataResult`
- `useState` declarations for loading, error, data (provided)
- `useEffect` block with TODO comments for:
  - Creating AbortController
  - Fetching from `/api/player/{nickname}`
  - Setting data/error/loading states
  - Cleanup function that aborts the request

- [ ] **Step 4: Modify main.tsx — add dynamic loading support**

Add comment block in `main.tsx` with TODO for switching from `window.__REPORT_DATA__` to `usePlayerData` hook when a nickname is provided via URL parameter.

- [ ] **Step 5: Verify app compiles**

Run: `cd web && npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add web/src/hooks/usePlayerData.ts web/src/components/ui/LoadingSpinner.tsx web/src/components/ui/ErrorMessage.tsx web/src/main.tsx
git commit -m "feat(education): scaffold 6.1 — usePlayerData hook + Loading/Error components with TODO markers"
```

---

## Task 5: Search with Debounce (Assignment 6.2)

**Files:**
- Create: `web/src/hooks/useDebounce.ts`
- Create: `web/src/components/ui/PlayerSearch.tsx`
- Modify: `web/src/components/Layout.tsx` — add search bar to header

### Context for students

The search component goes into the header (Layout.tsx). When the user types 3+ characters, after a 300ms debounce, a request is sent to `/api/search?q=...`. The debounce pattern uses `setTimeout`/`clearTimeout` in a `useEffect`. See `useTheme.ts` for the custom hook pattern. `AbortController` cancels in-flight requests when new input arrives (same pattern as 6.1).

- [ ] **Step 1: Create useDebounce.ts skeleton**

Create `web/src/hooks/useDebounce.ts` with:
- Function signature `useDebounce<T>(value: T, delay: number): T`
- `useState` for debouncedValue (provided)
- `useEffect` with TODO for setTimeout/clearTimeout logic

- [ ] **Step 2: Create PlayerSearch.tsx skeleton**

Create `web/src/components/ui/PlayerSearch.tsx` with:
- Full markup: input field, results dropdown, loading indicator (provided)
- `useState` for query, results, loading, error (provided)
- TODO blocks for:
  - Using `useDebounce` hook on query
  - `useEffect` that fetches when debounced value changes (3+ chars)
  - AbortController for cancelling stale requests
  - Rendering results list

- [ ] **Step 3: Add search slot to Layout.tsx**

Add a commented-out `<PlayerSearch />` placeholder in the header flex container of `Layout.tsx`, between the title/player-header block and `<ThemeToggle>`. Both Task 5 and Task 7 modify Layout.tsx — execute them sequentially.

- [ ] **Step 4: Verify app compiles**

Run: `cd web && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add web/src/hooks/useDebounce.ts web/src/components/ui/PlayerSearch.tsx web/src/components/Layout.tsx
git commit -m "feat(education): scaffold 6.2 — PlayerSearch + useDebounce with TODO markers"
```

---

## Task 6: Compare Two Players (Assignment 14.1)

**Files:**
- Create: `web/src/components/ui/CompareView.tsx`
- Create: `web/src/components/tabs/CompareTab.tsx`
- Modify: `web/src/App.tsx` — add CompareTab (or separate route)

### Context for students

Two nickname inputs → parallel fetch via `Promise.all` → side-by-side metrics. The component uses `usePlayerData` (from 6.1) twice. If one fails, show partial results + error for the failed side. Layout: two columns on desktop, stacked on mobile (Tailwind `grid grid-cols-1 sm:grid-cols-2`). Metrics to compare: ELO, win rate, K/D, ADR, best map.

- [ ] **Step 1: Create CompareView.tsx skeleton**

Create with:
- Two-column layout with player cards (provided markup)
- TODO for rendering each player's metrics from `ReportData`
- TODO for highlighting which player has better stats (color coding)

- [ ] **Step 2: Create CompareTab.tsx skeleton**

Create with:
- Two input fields for nicknames (provided markup)
- "Сравнить" button (provided)
- `useState` for both nicknames, both data results, loading states (provided)
- TODO blocks for:
  - `handleCompare` function using `Promise.all` / `Promise.allSettled`
  - Error handling for partial failures
  - Rendering `<CompareView>` when both datasets are available

- [ ] **Step 3: Wire CompareTab into App.tsx**

**Append** "Сравнение" at the END of each tab array (after "Радар" from Task 1). Add render condition using the next sequential index: `activeTab === 6 + tabOffset`.

**IMPORTANT:** This must execute AFTER Task 1 which also modifies App.tsx tab arrays.

- [ ] **Step 4: Verify app compiles**

Run: `cd web && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add web/src/components/ui/CompareView.tsx web/src/components/tabs/CompareTab.tsx web/src/App.tsx
git commit -m "feat(education): scaffold 14.1 — CompareTab + CompareView with TODO markers"
```

---

## Task 7: Auto-Refresh with Indicator (Assignment 14.2)

**Files:**
- Create: `web/src/hooks/usePolling.ts`
- Create: `web/src/components/ui/RefreshIndicator.tsx`
- Modify: `web/src/components/Layout.tsx` — add refresh indicator to header

### Context for students

The polling hook calls a fetch function on an interval (e.g., 60s). It tracks `lastUpdated` timestamp and compares old/new data to detect changes. The indicator shows a progress bar counting down to next refresh, plus a manual "Обновить" button. Changed values should briefly highlight (CSS transition on background). See `useTheme.ts` for the `useEffect` cleanup pattern — `clearInterval` in the cleanup function.

- [ ] **Step 1: Create usePolling.ts skeleton**

Create `web/src/hooks/usePolling.ts` with:
- Interface `UsePollingResult<T>` with `data`, `lastUpdated`, `isRefreshing`, `refresh`, `changedKeys` fields
- Function signature with `fetchFn`, `interval`, `enabled` params
- `useState` / `useRef` declarations (provided)
- TODO blocks for:
  - `setInterval` with cleanup in `useEffect`
  - Manual `refresh()` function
  - Comparing old and new data to find changed keys

- [ ] **Step 2: Create RefreshIndicator.tsx skeleton**

Create with:
- Progress bar showing time until next refresh (provided markup)
- "Обновить" button (provided)
- "Обновлено X сек назад" text (provided)
- TODO for calculating progress percentage from lastUpdated + interval

- [ ] **Step 3: Add indicator slot to Layout.tsx**

Add a commented-out `<RefreshIndicator />` placeholder below the header flex container in `Layout.tsx` (after the closing `</div>` of the header, before `{children}`). This executes AFTER Task 5 which also modifies Layout.tsx.

- [ ] **Step 4: Verify app compiles**

Run: `cd web && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add web/src/hooks/usePolling.ts web/src/components/ui/RefreshIndicator.tsx web/src/components/Layout.tsx
git commit -m "feat(education): scaffold 14.2 — usePolling + RefreshIndicator with TODO markers"
```

---

## Task 8: CSS Animations and Transitions (Assignment 16.1)

**Files:**
- Create: `web/src/components/ui/SkeletonCard.tsx`
- Create: `web/src/components/ui/AnimatedCounter.tsx`
- Modify: `web/src/app.css` — add keyframes and animation classes

### Context for students

CSS animations use `@keyframes` for custom animations and Tailwind's `transition-*` utilities for property transitions. Loading skeletons use a pulsing gradient (`animate-pulse` or custom shimmer). Animated counters use `requestAnimationFrame` to smoothly interpolate from 0 to target value. Stagger animations delay each child by an increasing amount (`animation-delay`). All animations respect `prefers-reduced-motion` via `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 1: Add animation keyframes to app.css**

Add to `web/src/app.css`:
- `@keyframes shimmer` (skeleton loading effect) — provided
- `@keyframes fadeIn` — provided
- `@keyframes slideUp` — provided
- `@keyframes expandDown` (for expandable rows) — provided
- `@media (prefers-reduced-motion: reduce)` block — provided
- TODO for `@keyframes countUp` custom animation
- CSS classes `.animate-shimmer`, `.animate-fade-in`, `.animate-slide-up`, `.animate-expand`

- [ ] **Step 2: Create SkeletonCard.tsx skeleton**

Create with:
- Markup for a pulsing card placeholder (provided)
- Props for width/height variants
- TODO for applying shimmer animation class

- [ ] **Step 3: Create AnimatedCounter.tsx skeleton**

Create with:
- Props: `value: number`, `duration?: number`, `suffix?: string`
- `useRef` for animation frame ID (provided)
- `useState` for displayed value (provided)
- TODO for `requestAnimationFrame` loop that interpolates from 0 to `value`
- TODO for cleanup on unmount

- [ ] **Step 4: Verify app compiles**

Run: `cd web && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add web/src/app.css web/src/components/ui/SkeletonCard.tsx web/src/components/ui/AnimatedCounter.tsx
git commit -m "feat(education): scaffold 16.1 — animations, SkeletonCard, AnimatedCounter with TODO markers"
```

---

## Task 9: Images and SVG Icons (Assignment 16.2)

**Files:**
- Create: `web/src/components/ui/MapImage.tsx`
- Create: `web/src/components/ui/StatIcon.tsx`
- Create: `web/public/maps/` — placeholder directory for map images

### Context for students

Map thumbnails display in WinRateTable rows. The `MapImage` component loads from `/maps/{mapName}.jpg`, with an `onError` fallback showing a colored circle with the first letter. SVG icons are inline React components — no external files needed. `loading="lazy"` on `<img>` defers loading until near viewport. For dark mode, SVGs can use `currentColor` to inherit text color.

- [ ] **Step 1: Create MapImage.tsx skeleton**

Create with:
- Props: `mapName: string`, `size?: number`
- `<img>` tag with `loading="lazy"` (provided)
- TODO for `onError` handler that switches to fallback
- TODO for fallback rendering (colored circle with first letter)

- [ ] **Step 2: Create StatIcon.tsx skeleton**

Create with:
- Props: `type: "kd" | "adr" | "hs" | "winRate"`, `size?: number`
- SVG wrapper with `currentColor` (provided)
- TODO for SVG `<path>` elements for each icon type
- BONUS: TODO for animated icon variant

- [ ] **Step 3: Create maps placeholder directory**

Create `web/public/maps/.gitkeep` and a README explaining where to put map images.

- [ ] **Step 4: Verify app compiles**

Run: `cd web && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add web/src/components/ui/MapImage.tsx web/src/components/ui/StatIcon.tsx web/public/maps/
git commit -m "feat(education): scaffold 16.2 — MapImage + StatIcon with TODO markers"
```

---

## Task 10: Test Infrastructure + Unit Tests (Assignment 10.1)

**Files:**
- Create: `web/vitest.config.ts`
- Create: `web/src/__tests__/setup.ts` — test setup (jsdom globals, cleanup, jest-dom)
- Create: `web/src/__tests__/fixtures/mockData.ts`
- Create: `web/src/__tests__/colors.test.ts`
- Create: `web/src/__tests__/useTheme.test.ts`
- Modify: `web/package.json` — add vitest + RTL dependencies and test script

### Context for students

Vitest is the test runner (compatible with Vite). `@testing-library/react` provides `render`, `screen`, `fireEvent` for component testing, and `renderHook` for hook testing. Tests live in `__tests__/` directories. `describe` blocks group related tests; each `test()` has a single assertion. `test.each` runs the same test with different data (parametrized). `vi.fn()` creates mock functions; `vi.spyOn` mocks specific methods (e.g., `localStorage.getItem`).

- [ ] **Step 1: Add test dependencies to web/package.json**

Add to devDependencies:
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`
- `@vitest/coverage-v8`

Add script: `"test": "vitest"`, `"test:coverage": "vitest run --coverage"`

- [ ] **Step 2: Create vitest.config.ts**

Create Vitest config with jsdom environment, setupFiles pointing to `src/__tests__/setup.ts`, coverage settings.

- [ ] **Step 3: Create setup.ts**

Create `web/src/__tests__/setup.ts` with `@testing-library/jest-dom` import and any jsdom global polyfills. This is shared by both unit tests (Task 10) and integration tests (Task 11).

- [ ] **Step 4: Create mockData.ts fixture**

Create test fixture with sample `ReportData` containing realistic values for all fields.

- [ ] **Step 5: Create colors.test.ts skeleton**

Create with:
- `describe("getStatColor")` block with 2 example tests (provided)
- TODO for students to add tests covering all tiers for each StatType
- `describe("getStatBgColor")` block with TODO
- Hint: use `test.each` for parametrized tests

- [ ] **Step 6: Create useTheme.test.ts skeleton**

Create with:
- Setup: mock `localStorage` and `matchMedia` (provided)
- `describe("useTheme")` with 1 example test (provided)
- TODO for tests: initial state from localStorage, toggle, system preference fallback

- [ ] **Step 7: Verify tests run (example tests pass)**

Run: `cd web && npx vitest run --reporter=verbose`
Expected: 2-3 example tests pass, rest are TODO stubs

- [ ] **Step 8: Commit**

```bash
git add web/vitest.config.ts web/package.json web/src/__tests__/
git commit -m "feat(education): scaffold 10.1 — Vitest setup + unit test skeletons with TODO markers"
```

---

## Task 11: Integration Tests (Assignment 5.1)

**Depends on:** Task 10 (Vitest setup, setup.ts, mockData.ts)

**Files:**
- Create: `web/src/__tests__/App.integration.test.tsx`

### Context for students

Integration tests render the full `<App>` component with mock data and assert on user interactions. `render(<App data={mockData} />)` mounts the app; `screen.getByText("Баны/Пики")` finds elements; `fireEvent.click(tab)` simulates clicks; `expect(element).toBeInTheDocument()` asserts visibility. The pattern: render → find element → interact → assert result. The test setup file and mock data fixture were created in Task 10.

- [ ] **Step 1: Create App.integration.test.tsx skeleton**

Create with:
- 2 working example tests (provided):
  - "renders app title from data"
  - "switches tabs on click"
- TODO stubs for 13+ additional tests:
  - Tab switching (all tabs)
  - Filter application in MatchHistoryTab
  - Pagination
  - Mode toggle (leader/all)
  - Theme toggle
  - WinRateTable row expansion
  - Empty data handling

- [ ] **Step 3: Verify example tests pass**

Run: `cd web && npx vitest run src/__tests__/App.integration.test.tsx --reporter=verbose`

- [ ] **Step 4: Commit**

```bash
git add web/src/__tests__/App.integration.test.tsx web/src/__tests__/setup.ts
git commit -m "feat(education): scaffold 5.1 — integration test skeletons with TODO markers"
```

---

## Task 12: REST API Proxy Server (Assignment 2.1)

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `server/src/routes/api.ts`
- Create: `server/src/middleware/cors.ts`
- Create: `server/src/middleware/rateLimit.ts`

### Context for students

Express.js is a minimal Node.js web framework. Routes handle HTTP requests (`app.get("/api/player/:nickname", handler)`). Middleware runs before route handlers (CORS headers, rate limiting). The server proxies requests to the FACEIT Open API (`open.faceit.com/data/v4`), adding the API key server-side so it's never exposed to the browser. Error handling: catch upstream errors, return structured JSON responses with appropriate HTTP status codes.

- [ ] **Step 1: Create server/package.json**

Create with dependencies: `express`, `cors`, `dotenv`. Dev dependencies: `@types/express`, `@types/cors`, `@types/node`, `tsx`, `typescript`. Script: `"dev": "tsx watch src/index.ts"`.

- [ ] **Step 2: Create server/tsconfig.json**

Standard Node.js TypeScript config.

- [ ] **Step 3: Create middleware skeletons**

Create `cors.ts` with TODO for setting CORS headers.
Create `rateLimit.ts` with TODO for implementing sliding window rate limiter.

- [ ] **Step 4: Create routes/api.ts skeleton**

Create with:
- 3 route stubs with TODO comments:
  - `GET /api/search?q=:query` — search players by nickname
  - `GET /api/player/:nickname` — get player stats
  - `GET /api/reports` — list available pre-generated reports
- Error handling middleware stub with TODO

- [ ] **Step 5: Create index.ts skeleton**

Create with:
- Express app creation (provided)
- Middleware registration (provided)
- Route mounting (provided)
- TODO for server listen with port from env

- [ ] **Step 6: Verify server compiles**

Run: `cd server && npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add server/
git commit -m "feat(education): scaffold 2.1 — Express proxy server with TODO markers"
```

---

## Execution Order & Dependencies

**NOT all tasks are independent.** Some share files and must be sequential:

### Dependency graph

- **Task 1 → Task 6**: Both modify `App.tsx` tab arrays. Execute sequentially.
- **Task 5 → Task 7**: Both modify `Layout.tsx`. Execute sequentially.
- **Task 10 → Task 11**: Task 11 uses Vitest setup and mockData from Task 10.
- **Task 4 → Tasks 5, 6**: Tasks 5 and 6 import `usePlayerData` from Task 4.

### Parallelizable groups

These groups have no shared files and CAN run in parallel:
- **Group A**: Tasks 2, 3, 8, 9, 12 (fully independent)
- **Group B**: Task 10 (test infra, no frontend file changes)

### Recommended sequential order

1. Task 10 (test infra) — sets up Vitest, needed by Task 11
2. Tasks 2, 3, 8, 9 (independent frontend components)
3. Task 1 (RadarTab + App.tsx modification)
4. Task 4 (usePlayerData hook)
5. Task 5 (search + Layout.tsx modification)
6. Task 6 (compare + App.tsx modification — AFTER Task 1)
7. Task 7 (polling + Layout.tsx modification — AFTER Task 5)
8. Task 11 (integration tests — AFTER Task 10)
9. Task 12 (server — standalone, any time)

All new types are colocated with their hooks/components — no changes to `types.ts` needed. The server directory (`server/`) is self-contained and does not affect the existing CLI scripts in `src/`.
