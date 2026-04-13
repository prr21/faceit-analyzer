import { Router } from "express"
import type { Request, Response } from "express"

const router = Router()

router.get("/reports", async (_req: Request, res: Response) => {
  res.status(501).json({ error: "Not implemented" })
})

export { router as apiRouter }
