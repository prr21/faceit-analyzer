import { Router } from "express"
import type { AppContext } from "../bootstrap"
import { getTeamAnalysis } from "../services/team.service"
import { AppError } from "../lib/errors"

export function createTeamRouter(ctx: AppContext): Router {
  const router = Router()

  // POST /api/team/analysis — полный анализ стратегии команды
  // Body: { playerIds: string[], teamName: string }
  router.post("/analysis", async (req, res, next) => {
    try {
      const { playerIds, teamName } = req.body as {
        playerIds?: string[]
        teamName?: string
      }

      if (!Array.isArray(playerIds) || playerIds.length === 0) {
        throw AppError.badRequest("playerIds должен быть непустым массивом")
      }
      if (!teamName || typeof teamName !== "string") {
        throw AppError.badRequest("teamName обязателен")
      }

      const result = await getTeamAnalysis(ctx.client, playerIds, teamName)
      res.json(result)
    } catch (err) {
      next(err)
    }
  })

  return router
}
