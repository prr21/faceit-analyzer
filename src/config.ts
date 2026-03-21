import "dotenv/config"
import teamsData from "./data/teams.json"

const apiKey = process.env.FACEIT_API_KEY
if (!apiKey) {
  throw new Error("FACEIT_API_KEY is not set in .env")
}

export const FACEIT_API_KEY = apiKey
export const DEFAULT_MATCH_LIMIT = 100
export const DEFAULT_GAME = "cs2"
export const EXCLUDED_MAPS = ["de_train"]
export const teams: Record<string, string[]> = teamsData
