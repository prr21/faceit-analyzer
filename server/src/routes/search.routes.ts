import { Router } from "express"
import { searchPlayers } from "@faceit/core"
import type { AppContext } from "../bootstrap"
import { AppError } from "../lib/errors"

export function createSearchRouter(ctx: AppContext): Router {
  const router = Router()

  // GET /api/search?q=nickname — поиск игроков
  router.get("/search", async (req, res, next) => {
    try {
      const query = req.query.q
      if (typeof query !== "string" || query.length < 2) {
        throw AppError.badRequest("Параметр q должен быть строкой длиной >= 2")
      }
      const results = await searchPlayers(ctx.client, query)
      res.json(results)
    } catch (err) {
      next(err)
    }
  })

  return router
}
