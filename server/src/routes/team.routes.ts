import { Router } from "express"
import type { AppContext } from "../bootstrap"
import { getTeamAnalysis, getTeamRoster } from "../services/team.service"
import { AppError } from "../lib/errors"

export function createTeamRouter(ctx: AppContext): Router {
  const router = Router()

  // GET /api/team/:teamId — состав команды для выбора игроков перед анализом
  router.get("/:teamId", async (req, res, next) => {
    try {
      const info = await getTeamRoster(ctx.client, req.params.teamId)
      res.json(info)
    } catch (err) {
      next(err)
    }
  })

  // POST /api/team/analysis — полный анализ стратегии команды
  // Body: { playerIds: string[], teamName: string }
  router.post("/analysis", async (req, res, next) => {
    try {
      const { playerIds, teamName } = req.body as {
        playerIds?: string[]
        teamName?: string
      }

      if (
        !Array.isArray(playerIds) ||
        playerIds.length === 0 ||
        !playerIds.every((id) => typeof id === "string" && id.length > 0)
      ) {
        throw AppError.badRequest("playerIds должен быть непустым массивом строк")
      }
      if (playerIds.length > 10) {
        throw AppError.badRequest("Слишком много playerIds (максимум 10)")
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
