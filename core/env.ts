import "dotenv/config"

export function getFaceitApiKey(): string {
  const key = process.env.FACEIT_API_KEY
  if (!key) throw new Error("FACEIT_API_KEY is not set in .env")
  return key
}
