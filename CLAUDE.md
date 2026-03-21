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
- `faceit_map_visual.html` — open in browser to visualize ban/pick stats (Chart.js)

## Architecture

```
src/
  config.ts              # loads .env (FACEIT_API_KEY), exports constants, loads team rosters
  api/
    client.ts            # createFaceitClient() — axios instance factory
    faceit-open.ts       # getPlayerId, getPlayerMatches, getMatchInfo, getPlayerInfo
    faceit-internal.ts   # getMatchVotingHistory (fetch), getMatchWithVoting (combined)
  types/faceit.ts        # all FACEIT API response interfaces + domain types
  utils/
    dedup.ts             # uniqueByField, replaceLangPlaceholder
    map-voting.ts        # classifyVotingEntity, findMapVotingTicket, isExcludedMap
  scripts/
    team-ban-pick.ts     # team map strategy analysis → writes to output/stats/
    player-ban-picks.ts  # individual player ban/pick analysis → console output
    find-smurfs.ts       # smurf detection in match history → console output
  data/teams.json        # team rosters (team name → player ID arrays)
```

- **API key** stored in `.env` (not committed), loaded via `dotenv` in `config.ts`
- **API layer** uses axios for FACEIT Open API (`open.faceit.com/data/v4`) and fetch for internal democracy API
- **Map voting rounds**: rounds 1-2 = first bans, 3-4 = picks/second bans, 5-6 = third bans, last = decider. `de_anubis` excluded.
- **Team match detection**: match counts as "team match" if 3+ roster players appear; target faction identified by leader

## Key Conventions

- Comments and console output are in Russian
- Scripts run via `tsx` (no separate compile step needed)
- `npm run typecheck` to verify types without emitting
