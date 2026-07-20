import { describe, it, expect } from "vitest"
import { normalizeMapLabel, parsePlayerMapStats } from "../analysis/player-map-stats"
import type { FaceitPlayerGameStats } from "../types/api"

function segment(label: string, mode: string, stats: Record<string, string>) {
  return { type: "Map", mode, label, stats }
}

function raw(segments: FaceitPlayerGameStats["segments"]): FaceitPlayerGameStats {
  return { player_id: "p1", game_id: "cs2", segments }
}

describe("normalizeMapLabel", () => {
  it("приводит label к формату пула", () => {
    expect(normalizeMapLabel("Nuke")).toBe("de_nuke")
    expect(normalizeMapLabel("Dust2")).toBe("de_dust2")
    expect(normalizeMapLabel("Dust 2")).toBe("de_dust2")
  })
})

describe("parsePlayerMapStats", () => {
  it("парсит строковые значения статистики", () => {
    const result = parsePlayerMapStats(
      raw([
        segment("Nuke", "5v5", {
          Matches: "117",
          Wins: "55",
          "Win Rate %": "47",
          "Average K/D Ratio": "1.31",
          "Average K/R Ratio": "0.8",
          ADR: "84.3",
        }),
      ]),
    )
    expect(result).toEqual([
      {
        map: "de_nuke",
        matches: 117,
        wins: 55,
        winRate: 47,
        avgKd: 1.31,
        avgKr: 0.8,
        adr: 84.3,
      },
    ])
  })

  it("отбрасывает Wingman, не-Map сегменты и карты вне пула", () => {
    const result = parsePlayerMapStats(
      raw([
        segment("Mirage", "Wingman", { Matches: "5" }),
        { type: "Weapon", mode: "5v5", label: "AK-47", stats: { Kills: "100" } },
        segment("Vertigo", "5v5", { Matches: "10" }),
        segment("Mirage", "5v5", { Matches: "20", Wins: "10", "Win Rate %": "50" }),
      ]),
    )
    expect(result.map(r => r.map)).toEqual(["de_mirage"])
  })

  it("NaN и отсутствующие ключи превращаются в 0", () => {
    const result = parsePlayerMapStats(raw([segment("Ancient", "5v5", { Matches: "мусор" })]))
    expect(result[0]).toMatchObject({ matches: 0, wins: 0, winRate: 0, avgKd: 0 })
  })

  it("null и пустые segments дают пустой массив", () => {
    expect(parsePlayerMapStats(null)).toEqual([])
    expect(parsePlayerMapStats(raw(undefined))).toEqual([])
  })

  it("сортирует по количеству матчей по убыванию", () => {
    const result = parsePlayerMapStats(
      raw([
        segment("Mirage", "5v5", { Matches: "5" }),
        segment("Nuke", "5v5", { Matches: "50" }),
      ]),
    )
    expect(result.map(r => r.map)).toEqual(["de_nuke", "de_mirage"])
  })
})
