import { describe, it, expect } from "vitest"
import { ACTIVE_MAP_POOL, ACTIVE_MAP_POOL_META } from "../constants"
import { isPoolMap } from "../analysis/helpers/map-voting"

describe("мап-пул", () => {
  it("ACTIVE_MAP_POOL выводится из меты", () => {
    expect(ACTIVE_MAP_POOL).toEqual(ACTIVE_MAP_POOL_META.map(m => m.id))
  })

  it("текущий Active Duty — 7 карт без устаревших", () => {
    expect(ACTIVE_MAP_POOL).toHaveLength(7)
    expect(ACTIVE_MAP_POOL).not.toContain("de_overpass")
    expect(ACTIVE_MAP_POOL).not.toContain("de_train")
    expect(ACTIVE_MAP_POOL).not.toContain("de_vertigo")
    expect(ACTIVE_MAP_POOL).toContain("de_cache")
  })

  it("у каждой карты валидная дата добавления", () => {
    for (const entry of ACTIVE_MAP_POOL_META) {
      expect(Number.isNaN(Date.parse(entry.addedAt))).toBe(false)
      expect(entry.name.length).toBeGreaterThan(0)
    }
  })

  it("isPoolMap согласован с производным пулом", () => {
    expect(isPoolMap("de_mirage")).toBe(true)
    expect(isPoolMap("de_overpass")).toBe(false)
  })
})
