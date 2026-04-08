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
  api/
    client.ts          # createFaceitClient(apiKey) — axios instance factory
    faceit-open.ts     # getPlayerId, getPlayerMatches, getAllPlayerMatches, getMatchInfo, getMatchStats, getPlayerInfo
    faceit-internal.ts # getMatchVotingHistory (fetch), getMatchWithVoting (combined)
  analysis/
    player-strategy.ts # analyzePlayerMapStrategy() — extracted from CLI script, pure function
    team-strategy.ts   # analyzeTeamMapStrategy() — extracted from CLI script, pure function
    smurf-detection.ts # collectEnemyPlayers(), filterSmurfs() — pure functions
  utils/
    cache.ts           # withCache — file-based caching for immutable API responses (.cache/)
    concurrency.ts     # batchWithLimit — bounded parallel execution with progress callback
    retry.ts           # withRetry — exponential backoff for 429/5xx errors
    match-stats.ts     # shared helpers: createEmptyFactionStats, trackWinRate, getMonthKey, getOrCreateTrend
    dedup.ts           # uniqueByField, replaceLangPlaceholder
    map-voting.ts      # classifyVotingEntity, getDeciderRound, findMapVotingTicket, isPoolMap(name, pool?)
  types/
    faceit.ts          # all FACEIT API response interfaces + domain types (single source of truth)
```

Key design decisions:
- **constants.ts vs env.ts**: constants are pure values (no side effects), env.ts uses `dotenv` and provides lazy `getFaceitApiKey()` that only throws when called — so web/ can safely import core/ without having an API key.
- **analysis/**: business logic extracted from CLI scripts into pure functions. They take already-fetched data and return structured stats. No I/O, no API calls.
- **isPoolMap(name, pool?)**: parametric — defaults to ACTIVE_MAP_POOL but accepts custom pool for testing/flexibility.
- **Types**: `core/types/faceit.ts` is the single source of truth. `web/src/types.ts` re-exports from `@faceit/core`.

### cli/ (@faceit/cli)

Thin wrappers: read args → call core/ API → call core/ analysis → write output.

```
cli/
  player.ts            # npm run player
  team.ts              # npm run team
  smurfs.ts            # npm run smurfs
  report-writer.ts     # HTML report generator (reads web/dist/index.html template)
  data/teams.json      # team rosters (static, CLI-only — will be dynamic in future)
```

### server/ (@faceit/server)

Express proxy server. Imports analysis functions from `@faceit/core` to generate stats in runtime.

```
server/src/
  index.ts             # Express app setup
  routes/api.ts        # API endpoints (search, player stats, reports)
  middleware/           # CORS, rate limiting
```

### web/ (@faceit/web)

React SPA with Vite, Tailwind CSS, ECharts. Dark/light theme, mobile responsive.

```
web/src/
  components/          # UI components (charts/, core/, tabs/)
  features/            # Feature modules (theme-1-frontend, theme-2-multimedia, etc.)
  pages/               # PlayerPage, TeamPage, SearchPage, ReportPage
  routing/             # HashRouter, paths, tabs, routes
  store/               # Zustand slices + TanStack Query hooks + API layer (mock/real)
  types.ts             # re-exports from @faceit/core
```

## Data Flow

```
CLI:     process.argv → core/api → core/analysis → console + JSON + HTML report
Server:  HTTP request → core/api → core/analysis → HTTP response
Web:     user input   → fetch(/api) → server → React UI
```

## FACEIT API Reference

### Open Data API (`open.faceit.com/data/v4`)

Authenticated via Bearer token (`FACEIT_API_KEY`). Rate limit: 10,000 requests/hour.

| Endpoint | Used in | Cached | Notes |
|---|---|---|---|
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
- **Team match detection**: match counts as "team match" if 3+ roster players appear; target faction identified by leader.
- **Player analysis**: bans/picks tracked only when player is faction leader; win rate tracked for ALL matches (faction detected via leader first, then fallback to `players[]` array).

## Key Conventions

- Comments and console output are in Russian
- Scripts run via `tsx` (no separate compile step needed)
- `npm run typecheck` to verify types across all workspaces
- Each workspace has its own `package.json` and `tsconfig.json`
- Web UI must support dark mode and mobile responsive for all new features
