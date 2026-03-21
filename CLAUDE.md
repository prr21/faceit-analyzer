# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of Node.js scripts for analyzing FACEIT CS2 match data — map ban/pick strategies, smurf detection, and tournament ELO analysis. All analysis scripts live in `banpicks/`.

## Running Scripts

```bash
npm install              # install dependencies (only axios)
node banpicks/team_ban_pick.js          # analyze team map ban/pick strategy
node banpicks/player_ban_picks.js       # analyze individual player ban/picks
node banpicks/find_smurfs_by_history.js # detect smurf accounts in match history
```

`faceit_elo_tournament.js` is a browser script (uses `fetch` + `await` at top level) — run it in browser DevTools console on faceit.com.

`faceit_map_visual.html` + `faceit_map_visual.js` — open the HTML file in a browser to visualize ban/pick stats using Chart.js (data is hardcoded in the JS file).

## Architecture

- **API layer**: Scripts use `axios` to call the FACEIT Open Data API (`open.faceit.com/data/v4`) with a Bearer token. Some scripts also use `fetch` for the internal FACEIT democracy API (`faceit.com/api/democracy/v1/match/{id}/history`) to get map voting data.
- **Configuration**: `banpicks/data.json` holds the API key and team rosters (team name -> array of player IDs). Scripts read team/player config from this file or have constants at the top of the file (`TEAM_NAME`, `PLAYER_NICKNAME`, `MATCH_LIMIT`).
- **Output**: `team_ban_pick.js` writes JSON results to `banpicks/stats/{team_name}.json`. Other scripts output to console via `console.table`.
- **Match filtering logic**: `team_ban_pick.js` considers a match a "team match" if at least 3 players from the roster appear. It identifies the target team by checking which faction's leader is a team member.
- **Map voting rounds**: Ban/pick analysis maps FACEIT voting rounds to phases — rounds 1-2 are first bans, rounds 3-4 are picks/second bans, rounds 5-6 are third bans, last round is decider. `de_anubis` is excluded from analysis.

## Key Conventions

- Comments, console output, and variable naming context are in Russian.
- No build step, linter, or test framework configured — scripts are run directly with `node`.
- To analyze a different team/player, change the constants at the top of the relevant script (`TEAM_NAME`, `PLAYER_NICKNAME`, etc.).
