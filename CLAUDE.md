# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript project for analyzing FACEIT CS2 match data — map ban/pick strategies, smurf detection, and tournament ELO analysis.

## Running Scripts

```bash
npm install                          # install dependencies
npm run team -- "Satanics Aura"      # analyze team map ban/pick strategy
npm run player -- "dErzz"            # analyze individual player ban/picks
npm run smurfs -- "ed1v9k"           # detect smurf accounts in match history
npm run typecheck                    # run TypeScript type checking
```

Scripts accept target name as CLI argument (`process.argv[2]`), falling back to defaults.

**Browser scripts** (in `browser/`, not part of TS build):
- `faceit_elo_tournament.js` — paste into DevTools console on faceit.com (uses browser cookies)

**Generated reports**: Both `npm run team` and `npm run player` auto-generate `output/reports/{Name}.html` — standalone Chart.js pages with charts, win rate, and trends.

## Architecture

```
src/
  config.ts              # loads .env (FACEIT_API_KEY), exports constants (DEFAULT_CONCURRENCY), loads team rosters
  api/
    client.ts            # createFaceitClient() — axios instance factory
    faceit-open.ts       # getPlayerId, getPlayerMatches, getAllPlayerMatches, getMatchInfo, getPlayerInfo
    faceit-internal.ts   # getMatchVotingHistory (fetch), getMatchWithVoting (combined)
  types/faceit.ts        # all FACEIT API response interfaces + domain types
  utils/
    cache.ts             # withCache — file-based caching for immutable API responses (.cache/)
    concurrency.ts       # batchWithLimit — bounded parallel execution with progress callback
    retry.ts             # withRetry — exponential backoff for 429/5xx errors
    match-stats.ts       # shared helpers: createEmptyFactionStats, trackWinRate, getMonthKey, getOrCreateTrend
    dedup.ts             # uniqueByField, replaceLangPlaceholder
    map-voting.ts        # classifyVotingEntity, getDeciderRound, findMapVotingTicket, isExcludedMap
    html-report.ts       # generateHtmlReport, generatePlayerHtmlReport — standalone HTML with Chart.js
  scripts/
    team-ban-pick.ts     # team map strategy analysis → writes to output/stats/ + output/reports/
    player-ban-picks.ts  # individual player analysis → writes to output/stats/ + output/reports/
    find-smurfs.ts       # smurf detection in match history → console output
  data/teams.json        # team rosters (team name → player ID arrays)
```

- **API key** stored in `.env` (not committed), loaded via `dotenv` in `config.ts`
- **API layer** uses axios for FACEIT Open API (`open.faceit.com/data/v4`) and fetch for internal democracy API
- **Caching**: `withCache()` caches immutable data (match details, voting history) in `.cache/` as JSON files. Player info is NOT cached (ELO changes after every match).
- **Concurrency**: `batchWithLimit()` limits parallel API requests (default 10) to avoid rate limits. All scripts use it instead of raw `Promise.all()`.
- **Retry**: `withRetry()` wraps all API calls with exponential backoff (3 retries, 1s/2s/4s delays) for 429 and 5xx errors.
- **Map pool**: `ACTIVE_MAP_POOL` in `config.ts` — allowlist of current CS2 maps. Only maps in the pool are analyzed; everything else (1v1 maps, removed maps) is skipped via `isPoolMap()`.
- **Map voting rounds**: rounds 1-2 = first bans, 3-4 = picks (BO3) or second bans (BO1), 5-6 = last bans, last = decider.
- **BO1**: all rounds are bans (drop), decider is last map standing. **BO3**: rounds 3-4 are picks, rounds 5-6 are bans.
- **Win rate**: tracked per map using `match.results.winner` + `match.voting.map.pick`. BO3 uses `detailed_results` for per-map results.
- **Trends**: matches grouped by calendar month (`started_at`) — shows how ban/pick preferences change over time.
- **Team match detection**: match counts as "team match" if 3+ roster players appear; target faction identified by leader
- **Player analysis**: bans/picks tracked only when player is faction leader; win rate tracked for ALL matches (faction detected via leader first, then fallback to `players[]` array)
- **Shared helpers** (`match-stats.ts`): `createEmptyFactionStats`, `trackWinRate`, `getMonthKey`, `getOrCreateTrend` — used by both team and player scripts

## FACEIT API Reference

### Open Data API (`open.faceit.com/data/v4`)

Authenticated via Bearer token (`FACEIT_API_KEY`). Rate limit: 10,000 requests/hour.

| Endpoint | Used in | Cached | Notes |
|---|---|---|---|
| `GET /players?nickname=X` | `getPlayerId()` | No | Returns `player_id` by nickname |
| `GET /players/{id}` | `getPlayerInfo()` | No | Player profile + ELO (changes every match) |
| `GET /players/{id}/history` | `getPlayerMatches()` | No | Match history. Params: `game`, `offset`, `limit`, `from`, `to` (unix timestamps) |
| `GET /matches/{id}` | `getMatchInfo()` | Yes | Full match detail: teams, leader, results, voting.map.pick, detailed_results |
| `GET /matches/{id}/stats` | — | — | Per-round stats (K/D, headshots) — not used, no voting data |
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
- **Player info** — NOT cached (ELO updates after every match)
- **Match history** — NOT cached (new matches appear constantly)

Cache storage: `.cache/` directory, MD5-hashed filenames, JSON format, no TTL.

## Key Conventions

- Comments and console output are in Russian
- Scripts run via `tsx` (no separate compile step needed)
- `npm run typecheck` to verify types without emitting
