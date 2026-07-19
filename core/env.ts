import "dotenv/config"

export function getFaceitApiKey(): string {
  const key = process.env.FACEIT_API_KEY
  if (!key) throw new Error("FACEIT_API_KEY is not set in .env")
  return key
}

export function getFaceitSessionToken(): string {
  const token = process.env.FACEIT_SESSION_TOKEN
  if (!token) {
    throw new Error(
      "FACEIT_SESSION_TOKEN is not set in .env — возьмите Bearer-токен из DevTools на faceit.com (Network → заголовок Authorization любого запроса к api)",
    )
  }
  return token
}
