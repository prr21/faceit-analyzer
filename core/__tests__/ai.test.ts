import { describe, it, expect } from "vitest"
import { extractSseDelta } from "../ai/provider"
import { buildMatchAIContext } from "../ai/context"
import type { MatchAnalysisResult, MatchTeamAnalysis } from "../usecases/match"
import type { TeamDropPickStats, MapWinRate } from "../types/domain"

describe("extractSseDelta", () => {
  it("достаёт дельта-токен из data-строки", () => {
    const line = `data: ${JSON.stringify({ choices: [{ delta: { content: "прив" } }] })}`
    expect(extractSseDelta(line)).toBe("прив")
  })

  it("возвращает null на [DONE], пустоту, не-data и битый JSON", () => {
    expect(extractSseDelta("data: [DONE]")).toBeNull()
    expect(extractSseDelta("data:")).toBeNull()
    expect(extractSseDelta(": keep-alive")).toBeNull()
    expect(extractSseDelta("data: {не json}")).toBeNull()
    expect(extractSseDelta(`data: ${JSON.stringify({ choices: [{ delta: {} }] })}`)).toBeNull()
  })
})

function wr(wins: number, total: number): MapWinRate {
  return { wins, losses: total - wins, total, rate: total > 0 ? (wins / total) * 100 : 0 }
}

function stats(mapWinRate: Record<string, MapWinRate>, count: number): TeamDropPickStats {
  const empty = { firstBan: {}, firstPick: {}, secondBan: {}, thirdBan: {} }
  return {
    target: { ...empty },
    enemy: { ...empty },
    decider: {},
    mapWinRate,
    deciderWinRate: {},
    eloHistory: [],
    favoriteUnderdog: { asFavorite: wr(0, 0), asUnderdog: wr(0, 0) },
    competitionStats: {},
    matchRecords: {},
    avgElo: 2000,
    trends: [],
    earliestGame: "",
    latestGame: "",
    mapInfo: "",
    count,
    allCount: count,
  }
}

function team(name: string, mapWinRate: Record<string, MapWinRate>): MatchTeamAnalysis {
  return {
    name,
    leader: "p1",
    avgElo: 2500,
    roster: [
      {
        playerId: "p1",
        nickname: `${name}_star`,
        skillLevel: 10,
        mapStats: [{ map: "de_mirage", matches: 30, wins: 18, winRate: 60, avgKd: 1.2 }],
      },
    ],
    stats: stats(mapWinRate, 25),
    mapHabits: {},
  }
}

describe("buildMatchAIContext", () => {
  const result: MatchAnalysisResult = {
    matchId: "1-abc",
    bestOf: 3,
    competitionName: "Test Cup",
    teams: [
      team("Alpha", { de_mirage: wr(15, 20) }),
      team("Bravo", { de_nuke: wr(10, 20) }),
    ],
    insights: [
      {
        type: "map-recommendations",
        teams: [
          {
            teamName: "Alpha",
            picks: [{ map: "de_mirage", score: 0.4, reason: "сильная карта", factors: [] }],
            bans: [{ map: "de_nuke", score: 0.3, reason: "опасно", factors: [] }],
            lowData: false,
          },
          {
            teamName: "Bravo",
            picks: [{ map: "de_nuke", score: 0.4, reason: "сильная карта", factors: [] }],
            bans: [{ map: "de_mirage", score: 0.3, reason: "опасно", factors: [] }],
            lowData: false,
          },
        ],
      },
    ],
  }

  it("включает названия команд, ELO, винрейт по картам и рекомендации", () => {
    const ctx = buildMatchAIContext(result)
    expect(ctx).toContain("Test Cup")
    expect(ctx).toContain("BO3")
    expect(ctx).toContain("Alpha")
    expect(ctx).toContain("Bravo")
    expect(ctx).toContain("2500")
    expect(ctx).toContain("mirage 75% (20)")
    expect(ctx).toContain("Рекомендации")
    expect(ctx).toContain("Пик:")
    expect(ctx).toContain("Alpha_star")
  })

  it("не падает на команде без данных по картам", () => {
    const empty: MatchAnalysisResult = {
      ...result,
      teams: [team("X", {}), team("Y", {})],
    }
    expect(() => buildMatchAIContext(empty)).not.toThrow()
    expect(buildMatchAIContext(empty)).toContain("нет данных по картам")
  })
})
