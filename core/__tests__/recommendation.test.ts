import { describe, it, expect } from "vitest"
import {
  RECO_WEIGHTS,
  shrunkWinRate,
  banRate,
  pickRate,
  buildTeamRecommendations,
  buildMapRecommendations,
} from "../analysis/recommendation"
import type { MapWinRate, TeamDropPickStats } from "../types/domain"

function wr(wins: number, losses: number): MapWinRate {
  const total = wins + losses
  return { wins, losses, total, rate: total > 0 ? (wins / total) * 100 : 0 }
}

function makeStats(overrides: Partial<TeamDropPickStats> = {}): TeamDropPickStats {
  const emptyFaction = { firstBan: {}, firstPick: {}, secondBan: {}, thirdBan: {} }
  return {
    target: { ...emptyFaction },
    enemy: { ...emptyFaction },
    decider: {},
    mapWinRate: {},
    deciderWinRate: {},
    eloHistory: [],
    favoriteUnderdog: {
      asFavorite: wr(0, 0),
      asUnderdog: wr(0, 0),
    },
    competitionStats: {},
    matchRecords: {},
    avgElo: 0,
    trends: [],
    earliestGame: "",
    latestGame: "",
    mapInfo: "",
    count: 30,
    allCount: 30,
    ...overrides,
  }
}

describe("shrunkWinRate", () => {
  it("тянет малые выборки к 0.5", () => {
    // 2/2 побед, но с прайором K=6 далеко не 1.0
    expect(shrunkWinRate(wr(2, 0))).toBeCloseTo((2 + 3) / (2 + 6))
    expect(shrunkWinRate(wr(2, 0))).toBeLessThan(0.7)
  })

  it("большая выборка почти не смещается", () => {
    expect(shrunkWinRate(wr(60, 40))).toBeCloseTo(0.6, 1)
  })

  it("отсутствие данных = ровно 0.5", () => {
    expect(shrunkWinRate(undefined)).toBe(0.5)
  })
})

describe("banRate / pickRate", () => {
  it("считает долю событий по карте", () => {
    const stats = {
      firstBan: { de_nuke: 6, de_mirage: 2 },
      secondBan: { de_nuke: 2 },
      thirdBan: {},
      firstPick: { de_ancient: 3, de_mirage: 1 },
    }
    expect(banRate(stats, "de_nuke")).toBeCloseTo(8 / 10)
    expect(pickRate(stats, "de_ancient")).toBeCloseTo(3 / 4)
    expect(pickRate(stats, "de_nuke")).toBe(0)
  })

  it("не делит на ноль при пустой статистике", () => {
    const empty = { firstBan: {}, firstPick: {}, secondBan: {}, thirdBan: {} }
    expect(banRate(empty, "de_nuke")).toBe(0)
    expect(pickRate(empty, "de_nuke")).toBe(0)
  })
})

describe("buildTeamRecommendations", () => {
  it("сильная карта против слабого соперника — топ-пик", () => {
    const own = makeStats({ mapWinRate: { de_mirage: wr(20, 5), de_nuke: wr(5, 20) } })
    const opp = makeStats({ mapWinRate: { de_mirage: wr(5, 20), de_nuke: wr(20, 5) } })
    const recs = buildTeamRecommendations(own, opp, "A")
    expect(recs.picks[0].map).toBe("de_mirage")
    expect(recs.bans[0].map).toBe("de_nuke")
    expect(recs.lowData).toBe(false)
  })

  it("любимый пик соперника поднимается в списке банов", () => {
    const own = makeStats()
    const oppWithPick = makeStats({
      target: { firstBan: {}, secondBan: {}, thirdBan: {}, firstPick: { de_anubis: 10 } },
    })
    const recs = buildTeamRecommendations(own, oppWithPick, "A")
    expect(recs.bans[0].map).toBe("de_anubis")
    const intent = recs.bans[0].factors.find(f => f.key === "intent")!
    expect(intent.contribution).toBeGreaterThan(0)
  })

  it("частый бан соперника снижает pick-score карты", () => {
    const own = makeStats({ mapWinRate: { de_mirage: wr(15, 5), de_train: wr(15, 5) } })
    const oppBansMirage = makeStats({
      target: { firstBan: { de_mirage: 10 }, secondBan: {}, thirdBan: {}, firstPick: {} },
    })
    const recs = buildTeamRecommendations(own, oppBansMirage, "A")
    const mirage = recs.picks.find(r => r.map === "de_mirage")!
    const train = recs.picks.find(r => r.map === "de_train")!
    expect(train.score).toBeGreaterThan(mirage.score)
  })

  it("ноль данных — все score около нуля и lowData", () => {
    const recs = buildTeamRecommendations(makeStats({ count: 0 }), makeStats({ count: 0 }), "A")
    for (const rec of [...recs.picks, ...recs.bans]) {
      expect(Math.abs(rec.score)).toBeLessThan(0.05)
      expect(rec.reason).toContain("недостаточно данных")
    }
    expect(recs.lowData).toBe(true)
  })

  it("reason собирается из топ-факторов по-русски", () => {
    const own = makeStats({ mapWinRate: { de_mirage: wr(20, 5) } })
    const opp = makeStats({ mapWinRate: { de_mirage: wr(5, 20) } })
    const recs = buildTeamRecommendations(own, opp, "A")
    expect(recs.picks[0].reason).toContain("винрейт выше, чем у соперника")
  })
})

describe("buildMapRecommendations", () => {
  it("возвращает инсайт с рекомендациями обеих команд в порядке фракций", () => {
    const a = makeStats({ mapWinRate: { de_mirage: wr(20, 5) } })
    const b = makeStats({ mapWinRate: { de_nuke: wr(20, 5) } })
    const insight = buildMapRecommendations(a, b, "Alpha", "Bravo")
    expect(insight.type).toBe("map-recommendations")
    expect(insight.teams[0].teamName).toBe("Alpha")
    expect(insight.teams[1].teamName).toBe("Bravo")
    expect(insight.teams[0].picks[0].map).toBe("de_mirage")
    expect(insight.teams[1].picks[0].map).toBe("de_nuke")
  })
})
