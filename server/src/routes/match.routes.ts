import { Router } from "express"
import type { AppContext } from "../bootstrap"
import { getMatchAnalysis } from "../services/match.service"

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

  return router
}
