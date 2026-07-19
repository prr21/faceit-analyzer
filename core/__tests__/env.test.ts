import { describe, it, expect, afterEach } from "vitest"
import { getFaceitSessionToken } from "../env"

describe("getFaceitSessionToken", () => {
  const saved = process.env.FACEIT_SESSION_TOKEN
  afterEach(() => {
    if (saved === undefined) delete process.env.FACEIT_SESSION_TOKEN
    else process.env.FACEIT_SESSION_TOKEN = saved
  })

  it("возвращает токен, когда задан", () => {
    process.env.FACEIT_SESSION_TOKEN = "test-token"
    expect(getFaceitSessionToken()).toBe("test-token")
  })

  it("бросает понятную ошибку без токена", () => {
    delete process.env.FACEIT_SESSION_TOKEN
    expect(() => getFaceitSessionToken()).toThrow("FACEIT_SESSION_TOKEN")
  })
})
