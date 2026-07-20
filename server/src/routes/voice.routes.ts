import { Router } from "express"
import type { AppContext } from "../bootstrap"
import {
  getVoiceFilePath,
  getVoiceStatus,
  startVoiceExtraction,
} from "../services/voice.service"

export function createVoiceRouter(ctx: AppContext): Router {
  const router = Router()

  // POST /api/match/:matchId/voices — старт извлечения голосов
  router.post("/:matchId/voices", (req, res, next) => {
    try {
      res.status(202).json(startVoiceExtraction(ctx.client, req.params.matchId))
    } catch (err) {
      next(err)
    }
  })

  // GET /api/match/:matchId/voices — статус джобы + список аудио
  router.get("/:matchId/voices", (req, res, next) => {
    try {
      res.json(getVoiceStatus(req.params.matchId))
    } catch (err) {
      next(err)
    }
  })

  // GET /api/match/:matchId/voices/:file — mp3 (sendFile: Content-Type + Range для перемотки)
  router.get("/:matchId/voices/:file", (req, res, next) => {
    try {
      res.sendFile(getVoiceFilePath(req.params.matchId, req.params.file))
    } catch (err) {
      next(err)
    }
  })

  return router
}
