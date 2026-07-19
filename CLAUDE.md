# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript monorepo (npm workspaces) for analyzing FACEIT CS2 match data — map ban/pick strategies, smurf detection, and tournament ELO analysis. Shared core library powers CLI scripts, Express server, and React web dashboard.

## Monorepo Structure

```
faceit/
├── core/           # @faceit/core — shared business logic, API clients, types
├── cli/            # @faceit/cli — CLI scripts (thin wrappers over core/)
├── server/         # @faceit/server — Express proxy server
├── web/            # @faceit/web — React SPA (Vite + Tailwind + ECharts)
├── browser/        # DevTools scripts (not a workspace)
└── package.json    # workspaces: ["core", "cli", "server", "web"]
```

All packages depend on `@faceit/core` via npm workspaces (`"@faceit/core": "*"`).

## Running Scripts

```bash
npm install                          # install all workspace dependencies
npm run team -- "Satanics Aura"      # analyze team map ban/pick strategy
npm run player -- "dErzz"            # analyze individual player ban/picks
npm run smurfs -- "ed1v9k"           # detect smurf accounts in match history
npm run dev:web                      # start web dev server (Vite)
npm run dev:server                   # start Express server (tsx watch)
npm run build:web                    # build web app
npm run typecheck                    # typecheck ALL workspaces
npm run typecheck:core               # typecheck core/ only
npm run typecheck:cli                # typecheck cli/ only
npm run typecheck:server             # typecheck server/ only
npm run typecheck:web                # typecheck web/ only
```

Scripts accept target name as CLI argument (`process.argv[2]`), falling back to defaults.

**Browser scripts** (in `browser/`, not part of TS build):
- `faceit_elo_tournament.js` — paste into DevTools console on faceit.com (uses browser cookies)

**Generated reports**: Both `npm run team` and `npm run player` auto-generate `output/reports/{Name}.html` — standalone pages with charts, win rate, and trends.

## Architecture

### core/ (@faceit/core)

Shared library — no side effects on import, safe for all consumers.

```
core/
  constants.ts         # pure values: ACTIVE_MAP_POOL, DEFAULT_GAME, DEFAULT_CONCURRENCY, DEFAULT_MATCH_LIMIT
  env.ts               # getFaceitApiKey() — lazy access, throws only when called (not on import)
  index.ts             # barrel export for the entire package
  types/
    api.ts             # FACEIT API response types: FaceitPlayer, FaceitMatch, FaceitMatchDetail, Voting*
    domain.ts          # domain types: *Stats, MatchRecord, TrendPeriod, EloSnapshot
    analysis.ts        # pipeline types: MatchWithData, MatchContext, AnalysisAccumulator, AnalysisConfig
    index.ts           # barrel re-export of all types
  api/
    client.ts          # createFaceitClient(apiKey), FaceitClient type alias (hides AxiosInstance)
    faceit-open.ts     # searchPlayers, searchTeams, getTeamInfo, getPlayerId, getPlayerMatches, getAllPlayerMatches, getMatchInfo, getMatchStats, getPlayerInfo
    faceit-internal.ts # getMatchVotingHistory (fetch), getMatchWithVoting (combined)
  analysis/
    pipeline.ts        # runAnalysisPipeline(matchesData, config) — shared analysis loop
    steps/             # pipeline steps — each does one thing
      elo-tracking.ts, favorite-underdog.ts, competition-type.ts,
      voting-analysis.ts, win-rate.ts, trend-elo.ts
    helpers/           # domain building blocks for pipeline and post-processing
      map-voting.ts    # isPoolMap, classifyVotingEntity, findMapVotingTicket, getDeciderRound
      match-record.ts  # buildMatchRecord, addMatchRecord
      trackers.ts      # trackWinRate, trackFavoriteUnderdog, trackCompetitionType, incrementMapCount
      factories.ts     # createEmptyFactionStats, createEmptyFavoriteUnderdog
      trends.ts        # getMonthKey, getOrCreateTrend
      streaks.ts       # calcStreaks
      elo-changes.ts   # fillEloChanges
    player-strategy.ts # analyzePlayerMapStrategy — thin wrapper over pipeline + post-processing
    team-strategy.ts   # analyzeTeamMapStrategy — thin wrapper over pipeline + post-processing
    smurf-detection.ts # collectEnemyPlayers(), filterSmurfs() — pure functions
  usecases/            # high-level orchestration shared by CLI and server
    player.ts          # fetchAndAnalyzePlayer(client, nickname) — full player pipeline
    team.ts            # fetchAndAnalyzeTeam(client, playerIds, teamName) — full team pipeline
    index.ts           # barrel export
  infra/               # generic infrastructure, not FACEIT-specific
    cache.ts           # CacheProvider interface + FileSystemCache + setCacheProvider
    retry.ts           # withRetry + RetryLogger + setRetryLogger
    concurrency.ts     # batchWithLimit — bounded parallel execution with progress callback
    dedup.ts           # uniqueByField, replaceLangPlaceholder
    date-format.ts     # formatTimestamp — locale-independent date formatting
```

Key design decisions:
- **constants.ts vs env.ts**: constants are pure values (no side effects), env.ts uses `dotenv` and provides lazy `getFaceitApiKey()` that only throws when called — so web/ can safely import core/ without having an API key.
- **analysis/pipeline.ts**: shared analysis loop eliminates ~80% duplication between player and team strategies. Differences injected via `AnalysisConfig` (resolveFaction, shouldProcessVoting, processVotingEntity, onMatch callback).
- **analysis/steps/**: each step is a pure function handling one concern (ELO, voting, win rate, etc.). Trend ELO uses O(1) incremental accumulator instead of O(n) filter.
- **infra/ vs analysis/helpers/**: `infra/` is generic infrastructure (cache, retry, concurrency) — reusable in any project. `analysis/helpers/` are FACEIT-domain building blocks used only inside `analysis/`.
- **CacheProvider**: interface abstraction — CLI uses FileSystemCache by default, server/ can swap to Redis via `setCacheProvider()`.
- **RetryLogger**: configurable via `setRetryLogger()` — server/ can use pino/winston instead of console.warn.
- **isPoolMap(name, pool?)**: parametric — defaults to ACTIVE_MAP_POOL but accepts custom pool for testing/flexibility.
- **Types split**: `types/api.ts` (API responses), `types/domain.ts` (business types), `types/analysis.ts` (pipeline coordination). `web/src/types.ts` re-exports from `@faceit/core`.

### cli/ (@faceit/cli)

Thin wrappers: read args → call `core/usecases` → write output.

```
cli/
  player.ts            # npm run player
  team.ts              # npm run team — arg: team name, UUID, or faceit.com team URL
  smurfs.ts            # npm run smurfs
  report-writer.ts     # HTML report generator (reads web/dist/index.html template)
```

`team.ts` resolves the roster dynamically: UUID/URL → `getTeamInfo`, otherwise `searchTeams` (exact name match preferred, else first result) → `getTeamInfo` → current members.

### server/ (@faceit/server)

Express server with layered architecture. Uses `@faceit/core` for API calls and analysis.

```
server/src/
  index.ts             # Express app setup, middleware chain, route mounting
  bootstrap.ts         # Composition Root: FaceitClient init, provider config (AppContext)
  lib/
    errors.ts          # AppError class (badRequest, notFound, internal)
  services/
    player.service.ts  # getPlayerAnalysis — delegates to core/usecases
    team.service.ts    # getTeamAnalysis (minPlayers=min(3,N)) + getTeamRoster (team info by UUID)
    search.service.ts  # searchAll (players+teams parallel) + searchPlayer (nickname lookup)
  routes/
    search.routes.ts   # GET /api/search?q= — combined {players, teams} search
    player.routes.ts   # GET /api/player/:nickname/analysis — full analysis
    team.routes.ts     # GET /api/team/:teamId (roster) + POST /api/team/analysis (full analysis)
  middleware/
    cors.ts            # CORS via `cors` package
    rateLimit.ts       # Rate limiting via `express-rate-limit`
    errorHandler.ts    # Centralized error handler (AppError + Axios + fallback)
```

Key patterns:
- **Composition Root** (`bootstrap.ts`): creates `AppContext { client }`, configures retry logger. Single initialization point.
- **Service Layer**: services orchestrate core/ functions, throw `AppError`, don't know about Express.
- **Factory Routers**: `createPlayerRouter(ctx)` — routes receive dependencies via argument, not global import.
- **Error Boundary**: `errorHandler` middleware catches AppError and unhandled exceptions; upstream FACEIT errors are mapped by status (401/403 → 502 UPSTREAM_AUTH, 429 → 503 UPSTREAM_RATE_LIMIT, else 502 UPSTREAM_ERROR) via `upstreamStatus()` from `lib/errors.ts`. Services must NOT swallow errors with blanket catch — map specific upstream statuses (e.g. 404 → AppError.notFound) and rethrow the rest.

### web/ (@faceit/web)

React SPA with Vite, Tailwind CSS, ECharts. Dark/light theme, mobile responsive.

```
web/src/
  components/          # UI components (charts/, core/, tabs/)
  features/            # Feature modules (theme-1-frontend, theme-2-multimedia, theme-4-async, theme-5-dynamic)
  pages/               # SearchPage, PlayerPage, TeamRosterPage, TeamPage, ReportPage
  routing/             # HashRouter, paths, tabs, routes
  store/               # Zustand slices + TanStack Query hooks + API layer (fetch → server)
  types.ts             # re-exports from @faceit/core
```

**Search & team flow (web):**

- `features/theme-4-async/ui/GlobalSearch.tsx` — единый поиск: regex на клиенте распознаёт UUID и `faceit.com/*/teams/{uuid}` и мгновенно навигирует на `/team/:teamId`, минуя `/api/search`; иначе два блока результатов — игроки и команды.
- `/team/:teamId` → `TeamRosterPage` (состав команды, чекбоксы — все отмечены по умолчанию, валидация 2–5 игроков, мутация анализа через `useAnalyzeTeamMutation` кладёт результат в TanStack Query cache).
- `/team/:teamId/analysis/:tab?` → `TeamPage` читает результат из кеша (fallback 1: `window.__REPORT_DATA__` для CLI-отчётов, fallback 2: ссылка на страницу ростера).
- `store/api/player.ts:analyzeTeam` оборачивает ответ сервера `{ stats }` в `ReportData { type: "team", name, stats }` — без этой обёртки `ReportView` не отличает team от player.

**`features/theme-*/`**: feature modules grouped by theme — historical naming from the education scaffolding. `master` is the development branch: it contains only working implementations imported by production UI (Layout, ReportView, etc.); unused education stubs have been removed. The `education` branch keeps TODO-stub versions as student assignments. Don't rename the directories — it keeps merges with `education` manageable.

## Data Flow

```
CLI:     process.argv → core/usecases → console + JSON + HTML report
Server:  HTTP request → services → core/usecases → HTTP response
Web:     user input   → fetch(/api) → server → React UI
```

## FACEIT API Reference

### Open Data API (`open.faceit.com/data/v4`)

Authenticated via Bearer token (`FACEIT_API_KEY`). Rate limit: 10,000 requests/hour.

| Endpoint | Used in | Cached | Notes |
|---|---|---|---|
| `GET /search/players?nickname=X` | `searchPlayers()` | No | Fuzzy search, returns up to `limit` results |
| `GET /search/teams?nickname=X` | `searchTeams()` | No | Fuzzy team search by name |
| `GET /teams/{team_id}` | `getTeamInfo()` | No | Team info + `members[]` (player_id, nickname, avatar, skill_level) |
| `GET /players?nickname=X` | `getPlayerId()` | No | Returns `player_id` by nickname |
| `GET /players/{id}` | `getPlayerInfo()` | No | Player profile + ELO (changes every match) |
| `GET /players/{id}/history` | `getPlayerMatches()` | No | Match history. Params: `game`, `offset`, `limit`, `from`, `to` (unix timestamps) |
| `GET /matches/{id}` | `getMatchInfo()` | Yes | Full match detail: teams, leader, results, voting.map.pick, detailed_results |
| `GET /matches/{id}/stats` | `getMatchStats()` | Yes | Per-round stats (K/D, headshots, ADR) |
| `GET /players/{id}/stats/{game}` | — | — | Aggregated stats per map — not used, no ban/pick data |

**Match history pagination**: `offset` breaks after 1000. Use `from`/`to` (unix timestamps) for time-based pagination. `getAllPlayerMatches()` auto-paginates using `to` parameter.

**No batch endpoints** — each match requires individual API calls.

### Internal Democracy API (`www.faceit.com/api/democracy/v1`)

No authentication required. Uses `fetch` (not axios).

| Endpoint | Used in | Cached | Notes |
|---|---|---|---|
| `GET /match/{id}/history` | `getMatchVotingHistory()` | Yes | Map veto rounds: bans, picks, decider. Returns `payload.tickets[]` |

**Important**: `fetch` does not throw on HTTP errors — must check `response.ok` manually and create error with `.status` for `withRetry` compatibility.

### What gets cached and why

- **Match details** (`match:{id}`) — immutable after match ends
- **Voting history** (`voting:{id}`) — immutable after match ends
- **Match stats** (`matchstats:{id}`) — immutable after match ends
- **Player info** — NOT cached (ELO updates after every match)
- **Match history** — NOT cached (new matches appear constantly)

Cache storage: `.cache/` directory, MD5-hashed filenames, JSON format, no TTL.

## Domain Logic

- **Map pool**: `ACTIVE_MAP_POOL` in `core/constants.ts` — allowlist of current CS2 maps. Only maps in the pool are analyzed; everything else is skipped via `isPoolMap()`.
- **Map voting rounds**: rounds 1-2 = first bans, 3-4 = picks (BO3) or second bans (BO1), 5-6 = last bans, last = decider.
- **BO1**: all rounds are bans (drop), decider is last map standing. **BO3**: rounds 3-4 are picks, rounds 5-6 are bans.
- **Win rate**: tracked per map using `match.results.winner` + `match.voting.map.pick`. BO3 uses `detailed_results` for per-map results.
- **Trends**: matches grouped by calendar month (`started_at`) — shows how ban/pick preferences change over time.
- **Team match detection**: match counts as "team match" if `minPlayers` roster players appear (default 3). `server/team.service.getTeamAnalysis` передаёт `minPlayers = Math.min(3, playerIds.length)`, чтобы выбор из 2 игроков тоже имел смысл. Target faction identified by leader.
- **Player analysis**: bans/picks tracked only when player is faction leader; win rate tracked for ALL matches (faction detected via leader first, then fallback to `players[]` array).

## Key Conventions

- Comments and console output are in Russian
- Scripts run via `tsx` (no separate compile step needed)
- `npm run typecheck` to verify types across all workspaces
- Each workspace has its own `package.json` and `tsconfig.json`
- Web UI must support dark mode and mobile responsive for all new features
