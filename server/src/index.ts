import "dotenv/config"
import express from "express"
import { corsMiddleware } from "./middleware/cors"
import { rateLimit } from "./middleware/rateLimit"
import { apiRouter } from "./routes/api"
import { bootstrap } from "./bootstrap"
import { createSearchRouter } from "./routes/search.routes"
import { createPlayerRouter } from "./routes/player.routes"
import { createTeamRouter } from "./routes/team.routes"
import { errorHandler } from "./middleware/errorHandler"

const app = express()

app.use(express.json())
app.use(corsMiddleware)
app.use(rateLimit({ windowMs: 60_000, maxRequests: 100 }))

const ctx = bootstrap()
app.use("/api", createSearchRouter(ctx))
app.use("/api/player", createPlayerRouter(ctx))
app.use("/api/team", createTeamRouter(ctx))
app.use("/api", apiRouter)

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use(errorHandler)

const PORT = parseInt(process.env.PORT || "3000", 10)

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`API: http://localhost:${PORT}/api/search?q=nickname`)

  if (!process.env.FACEIT_API_KEY) {
    console.warn("⚠ FACEIT_API_KEY не задан в .env — API-запросы не будут работать")
  }
})
