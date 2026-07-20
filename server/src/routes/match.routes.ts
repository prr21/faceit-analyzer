import { Router } from "express"
import { streamChatCompletion } from "@faceit/core"
import type { AppContext } from "../bootstrap"
import { getMatchAnalysis } from "../services/match.service"
import {
  assertAiConfigured,
  buildMatchChatSystemPrompt,
  resolveChatMessages,
  validateChatRequest,
} from "../services/ai.service"

export function createMatchRouter(ctx: AppContext): Router {
  const router = Router()

  // GET /api/match/:matchId/analysis — пре-матч анализ обеих команд комнаты
  router.get("/:matchId/analysis", async (req, res, next) => {
    try {
      const result = await getMatchAnalysis(ctx.client, req.params.matchId)
      res.json(result)
    } catch (err) {
      next(err)
    }
  })

  // POST /api/match/:matchId/chat — AI-чат по матчу, ответ стримится через SSE.
  // Body: { result: MatchAnalysisResult, messages: ChatMessage[] } (пустой messages → выжимка).
  router.post("/:matchId/chat", async (req, res, next) => {
    let headersSent = false
    try {
      const { result, messages } = validateChatRequest(req.body)
      assertAiConfigured() // до заголовков — чтобы ошибка конфига ушла как JSON

      const system = buildMatchChatSystemPrompt(result)
      const chatMessages = resolveChatMessages(messages)

      // Обрыв соединения клиентом → отменяем запрос к AI
      const ac = new AbortController()
      req.on("close", () => ac.abort())

      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache, no-transform")
      res.setHeader("Connection", "keep-alive")
      res.flushHeaders()
      headersSent = true

      await streamChatCompletion({
        system,
        messages: chatMessages,
        signal: ac.signal,
        onToken: token => res.write(`data: ${JSON.stringify({ t: token })}\n\n`),
      })

      res.write("data: [DONE]\n\n")
      res.end()
    } catch (err) {
      if (headersSent) {
        // Заголовки уже ушли — сообщаем об ошибке SSE-событием, а не JSON
        if (!(err instanceof Error && err.name === "AbortError")) {
          const message = err instanceof Error ? err.message : "Ошибка AI"
          res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`)
        }
        res.end()
      } else {
        next(err)
      }
    }
  })

  return router
}
