import { Router } from "express"
import type { AppContext } from "../bootstrap"
import { getPlayerAnalysis } from "../services/player.service"
import { AppError } from "../lib/errors"

export function createPlayerRouter(ctx: AppContext): Router {
  const router = Router()

  // GET /api/player/:nickname/analysis — полный анализ стратегии игрока
  router.get("/:nickname/analysis", async (req, res, next) => {
    try {
      const { nickname } = req.params
      if (!nickname || nickname.length < 2) {
        throw AppError.badRequest("Nickname должен быть не менее 2 символов")
      }
      const result = await getPlayerAnalysis(ctx.client, nickname)
      res.json(result)
    } catch (err) {
      next(err)
    }
  })

  return router
}
