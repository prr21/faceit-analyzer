import { Router } from "express"
import type { AppContext } from "../bootstrap"
import { searchAll } from "../services/search.service"

export function createSearchRouter(ctx: AppContext): Router {
  const router = Router()

  // GET /api/search?q=query — совмещённый поиск по игрокам и командам
  router.get("/search", async (req, res, next) => {
    try {
      const query = req.query.q
      const q = typeof query === "string" ? query : ""
      const result = await searchAll(ctx.client, q)
      res.json(result)
    } catch (err) {
      next(err)
    }
  })

  return router
}
