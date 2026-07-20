import { describe, it, expect, afterEach } from "vitest"
import { getFaceitApiKey } from "../env"

describe("getFaceitApiKey", () => {
  const saved = process.env.FACEIT_API_KEY
  afterEach(() => {
    if (saved === undefined) delete process.env.FACEIT_API_KEY
    else process.env.FACEIT_API_KEY = saved
  })

  it("возвращает ключ, когда задан", () => {
    process.env.FACEIT_API_KEY = "test-key"
    expect(getFaceitApiKey()).toBe("test-key")
  })

  it("бросает понятную ошибку без ключа", () => {
    delete process.env.FACEIT_API_KEY
    expect(() => getFaceitApiKey()).toThrow("FACEIT_API_KEY")
  })
})
