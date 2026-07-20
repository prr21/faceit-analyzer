import { describe, it, expect } from "vitest"
import {
  RECO_WEIGHTS,
  shrunkWinRate,
  banRate,
  pickRate,
  mapTenureMonths,
  isEstablishedMap,
  avoidanceSignal,
  buildTeamRecommendations,
  buildMapRecommendations,
} from "../analysis/recommendation"
import { ACTIVE_MAP_POOL } from "../constants"
import type { MapWinRate, TeamDropPickStats } from "../types/domain"

// Фиксированный «сейчас»: Ancient/Nuke/... (2023) — established; Cache (2026-06-01) — новая
const NOW = Date.parse("2026-07-20")
const ALL_ESTABLISHED = Date.parse("2027-06-01") // тут и Cache уже established

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
    const own = makeStats({ mapWinRate: { de_mirage: wr(15, 5), de_inferno: wr(15, 5) } })
    const oppBansMirage = makeStats({
      target: { firstBan: { de_mirage: 10 }, secondBan: {}, thirdBan: {}, firstPick: {} },
    })
    const recs = buildTeamRecommendations(own, oppBansMirage, "A")
    const mirage = recs.picks.find(r => r.map === "de_mirage")!
    const inferno = recs.picks.find(r => r.map === "de_inferno")!
    expect(inferno.score).toBeGreaterThan(mirage.score)
  })

  it("ноль данных — все score около нуля и lowData", () => {
    const recs = buildTeamRecommendations(
      makeStats({ count: 0 }),
      makeStats({ count: 0 }),
      "A",
      ACTIVE_MAP_POOL,
      ALL_ESTABLISHED,
    )
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

describe("tenure / avoidance", () => {
  it("mapTenureMonths: старая карта established, Cache — свежая", () => {
    expect(mapTenureMonths("de_nuke", NOW)).toBeGreaterThan(RECO_WEIGHTS.avoidance.establishedMonths)
    expect(mapTenureMonths("de_cache", NOW)).toBeLessThan(RECO_WEIGHTS.avoidance.establishedMonths)
    expect(isEstablishedMap("de_nuke", NOW)).toBe(true)
    expect(isEstablishedMap("de_cache", NOW)).toBe(false)
  })

  it("avoidanceSignal: established + недоигрывание → сигнал, нормальная доля → 0", () => {
    const stats = makeStats({
      mapWinRate: {
        de_mirage: wr(20, 20),
        de_nuke: wr(20, 20),
        de_dust2: wr(20, 20),
        de_ancient: wr(20, 20),
        de_anubis: wr(20, 20),
        // de_inferno — ни разу (established → избегание)
      },
      count: 40,
    })
    expect(avoidanceSignal(stats, "de_inferno", NOW)).toBeGreaterThan(0)
    expect(avoidanceSignal(stats, "de_mirage", NOW)).toBe(0)
  })

  it("avoidanceSignal: новая карта (Cache) с малым семплом → 0, не избегание", () => {
    const stats = makeStats({
      mapWinRate: { de_mirage: wr(20, 20), de_nuke: wr(20, 20) },
      count: 40,
    })
    expect(avoidanceSignal(stats, "de_cache", NOW)).toBe(0)
  })

  it("avoidanceSignal: пустая история (count 0) → 0", () => {
    expect(avoidanceSignal(makeStats({ count: 0 }), "de_inferno", NOW)).toBe(0)
  })

  it("избегаемая established-карта попадает в баны с причиной «избегает», Cache — «недавно в пуле»", () => {
    const avoidInferno = makeStats({
      mapWinRate: {
        de_mirage: wr(20, 20),
        de_nuke: wr(20, 20),
        de_dust2: wr(20, 20),
        de_ancient: wr(20, 20),
        de_anubis: wr(20, 20),
      },
      count: 40,
    })
    const balancedOpp = makeStats({
      mapWinRate: {
        de_mirage: wr(10, 10),
        de_nuke: wr(10, 10),
        de_dust2: wr(10, 10),
        de_ancient: wr(10, 10),
        de_anubis: wr(10, 10),
        de_inferno: wr(10, 10),
        de_cache: wr(2, 2),
      },
      count: 40,
    })
    const recs = buildTeamRecommendations(avoidInferno, balancedOpp, "A", ACTIVE_MAP_POOL, NOW)
    const inferno = recs.bans.find(r => r.map === "de_inferno")!
    expect(inferno.reason).toContain("избегает")
    const cache = recs.picks.find(r => r.map === "de_cache")!
    expect(cache.reason).toContain("недавно в пуле")
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
