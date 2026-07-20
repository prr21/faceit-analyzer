import path from "path"
import { fileURLToPath } from "url"
import { config as loadEnv } from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
loadEnv({ path: path.resolve(__dirname, "../../.env") })

import express from "express"
import { corsMiddleware } from "./middleware/cors"
import { rateLimit } from "./middleware/rateLimit"
import { bootstrap } from "./bootstrap"
import { createSearchRouter } from "./routes/search.routes"
import { createPlayerRouter } from "./routes/player.routes"
import { createTeamRouter } from "./routes/team.routes"
import { createVoiceRouter } from "./routes/voice.routes"
import { createMatchRouter } from "./routes/match.routes"
import { errorHandler } from "./middleware/errorHandler"

const app = express()

// Лимит поднят: AI-чат шлёт полный MatchAnalysisResult (истории матчей обеих команд)
app.use(express.json({ limit: "5mb" }))
app.use(corsMiddleware)
app.use(rateLimit({ windowMs: 60_000, maxRequests: 100 }))

const ctx = bootstrap()
app.use("/api", createSearchRouter(ctx))
app.use("/api/player", createPlayerRouter(ctx))
app.use("/api/team", createTeamRouter(ctx))
app.use("/api/match", createVoiceRouter(ctx))
app.use("/api/match", createMatchRouter(ctx))

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use(errorHandler)

const PORT = parseInt(process.env.PORT || "3000", 10)
const HOST = process.env.HOST || "127.0.0.1"

const server = app.listen(PORT, HOST, () => {
  console.log(`Сервер запущен: http://${HOST}:${PORT}`)
  console.log(`Health check: http://${HOST}:${PORT}/health`)
  console.log(`API: http://${HOST}:${PORT}/api/search?q=nickname`)

  if (!process.env.FACEIT_API_KEY) {
    console.warn("⚠ FACEIT_API_KEY не задан в .env — API-запросы не будут работать")
  }
})

// Холодный пре-матч анализ двух команд может превысить дефолтные 300s Node
server.requestTimeout = 600_000
server.headersTimeout = 610_000
