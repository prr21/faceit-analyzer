import { ACTIVE_MAP_POOL } from "../constants"
import type {
  FactionBanPickStats,
  MapWinRate,
  TeamDropPickStats,
} from "../types/domain"
import type {
  FactorContribution,
  MapRecommendation,
  MapRecommendationsInsight,
  TeamRecommendations,
} from "../types/recommendation"

// Все настраиваемые константы скоринга в одном месте
export const RECO_WEIGHTS = {
  shrinkageK: 6, // псевдо-матчей прайора к 0.5
  habitMinMatches: 10, // ниже — habit-факторы масштабируются count/10
  pick: { edge: 0.5, own: 0.3, availability: 0.2 },
  ban: { oppEdge: 0.4, threat: 0.25, intent: 0.25, decider: 0.1 },
} as const

/**
 * Эмпирико-байесовский shrinkage винрейта к 0.5:
 * малые выборки не дают ложной уверенности.
 */
export function shrunkWinRate(wr: MapWinRate | undefined, k: number = RECO_WEIGHTS.shrinkageK): number {
  const wins = wr?.wins ?? 0
  const total = wr?.total ?? 0
  return (wins + k * 0.5) / (total + k)
}

function sumCounts(record: Record<string, number>): number {
  return Object.values(record).reduce((acc, n) => acc + n, 0)
}

/** Доля банов карты среди всех бан-событий команды */
export function banRate(stats: FactionBanPickStats, map: string): number {
  const banned =
    (stats.firstBan[map] ?? 0) + (stats.secondBan[map] ?? 0) + (stats.thirdBan[map] ?? 0)
  const total = sumCounts(stats.firstBan) + sumCounts(stats.secondBan) + sumCounts(stats.thirdBan)
  return banned / Math.max(1, total)
}

/** Доля пиков карты среди всех пик-событий команды */
export function pickRate(stats: FactionBanPickStats, map: string): number {
  return (stats.firstPick[map] ?? 0) / Math.max(1, sumCounts(stats.firstPick))
}

function deciderRate(decider: Record<string, number>, map: string): number {
  return (decider[map] ?? 0) / Math.max(1, sumCounts(decider))
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}

function wrDetail(own: MapWinRate | undefined, opp: MapWinRate | undefined): string {
  const fmt = (wr: MapWinRate | undefined) =>
    wr && wr.total > 0 ? `${Math.round(wr.rate)}% (${wr.total})` : "нет данных"
  return `${fmt(own)} против ${fmt(opp)}`
}

// Русские тексты причин по знаку вклада фактора
const REASON_TEXTS: Record<string, { positive: string; negative: string }> = {
  edge: { positive: "винрейт выше, чем у соперника", negative: "винрейт ниже, чем у соперника" },
  own: { positive: "стабильно высокий собственный винрейт", negative: "собственный винрейт ниже 50%" },
  availability: {
    positive: "соперник редко банит эту карту",
    negative: "соперник часто банит эту карту — пик может сгореть",
  },
  oppEdge: { positive: "соперник заметно сильнее на этой карте", negative: "перевес на этой карте у вас" },
  threat: { positive: "у соперника высокий винрейт на карте", negative: "соперник слаб на этой карте" },
  intent: { positive: "соперник любит пикать эту карту", negative: "соперник почти не пикает эту карту" },
  decider: {
    positive: "в десайдерах соперник силён на этой карте",
    negative: "в десайдерах соперник слаб на этой карте",
  },
}

function buildReason(factors: FactorContribution[]): string {
  const top = [...factors]
    .filter(f => Math.abs(f.contribution) > 0.01)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 2)
  if (top.length === 0) return "недостаточно данных для уверенного вывода"
  return top
    .map(f => {
      const texts = REASON_TEXTS[f.key]
      const text = f.contribution >= 0 ? texts.positive : texts.negative
      return f.detail ? `${text} (${f.detail})` : text
    })
    .join("; ")
}

function factor(
  key: string,
  label: string,
  value: number,
  weight: number,
  detail?: string,
): FactorContribution {
  return { key, label, value, weight, contribution: value * weight, detail }
}

/**
 * Скоринг карты для пика командой own против opp.
 * Все факторы нормализованы к ~[-1, 1].
 */
function scorePick(own: TeamDropPickStats, opp: TeamDropPickStats, map: string): MapRecommendation {
  const w = RECO_WEIGHTS.pick
  const wrOwn = shrunkWinRate(own.mapWinRate[map])
  const wrOpp = shrunkWinRate(opp.mapWinRate[map])
  const habitScaleOpp = Math.min(1, opp.count / RECO_WEIGHTS.habitMinMatches)
  const oppBan = banRate(opp.target, map)

  const factors: FactorContribution[] = [
    factor("edge", "Преимущество по винрейту", 2 * (wrOwn - wrOpp), w.edge, wrDetail(own.mapWinRate[map], opp.mapWinRate[map])),
    factor("own", "Собственный винрейт", 2 * (wrOwn - 0.5), w.own, wrDetail(own.mapWinRate[map], undefined)),
    factor("availability", "Риск бана соперником", -oppBan * habitScaleOpp, w.availability, `банит в ${pct(oppBan)} вето`),
  ]

  const score = factors.reduce((acc, f) => acc + f.contribution, 0)
  return { map, score, reason: buildReason(factors), factors }
}

/**
 * Скоринг карты для бана командой own против opp:
 * опасность карты, намерение соперника её пикать, сила соперника в десайдерах.
 */
function scoreBan(own: TeamDropPickStats, opp: TeamDropPickStats, map: string): MapRecommendation {
  const w = RECO_WEIGHTS.ban
  const wrOwn = shrunkWinRate(own.mapWinRate[map])
  const wrOpp = shrunkWinRate(opp.mapWinRate[map])
  const habitScaleOpp = Math.min(1, opp.count / RECO_WEIGHTS.habitMinMatches)
  const oppPick = pickRate(opp.target, map)
  const oppDeciderRate = deciderRate(opp.decider, map)
  const oppDeciderWr = shrunkWinRate(opp.deciderWinRate[map])

  const factors: FactorContribution[] = [
    factor("oppEdge", "Преимущество соперника", 2 * (wrOpp - wrOwn), w.oppEdge, wrDetail(opp.mapWinRate[map], own.mapWinRate[map])),
    factor("threat", "Сила соперника на карте", 2 * (wrOpp - 0.5), w.threat, wrDetail(opp.mapWinRate[map], undefined)),
    factor("intent", "Намерение соперника пикать", oppPick * habitScaleOpp, w.intent, `пикает в ${pct(oppPick)} вето`),
    factor("decider", "Десайдер соперника", oppDeciderRate * 2 * (oppDeciderWr - 0.5), w.decider),
  ]

  const score = factors.reduce((acc, f) => acc + f.contribution, 0)
  return { map, score, reason: buildReason(factors), factors }
}

export function buildTeamRecommendations(
  own: TeamDropPickStats,
  opp: TeamDropPickStats,
  teamName: string,
  pool: string[] = ACTIVE_MAP_POOL,
): TeamRecommendations {
  const picks = pool.map(map => scorePick(own, opp, map)).sort((a, b) => b.score - a.score)
  const bans = pool.map(map => scoreBan(own, opp, map)).sort((a, b) => b.score - a.score)
  return {
    teamName,
    picks,
    bans,
    lowData: own.count < RECO_WEIGHTS.habitMinMatches || opp.count < RECO_WEIGHTS.habitMinMatches,
  }
}

export function buildMapRecommendations(
  a: TeamDropPickStats,
  b: TeamDropPickStats,
  nameA: string,
  nameB: string,
): MapRecommendationsInsight {
  return {
    type: "map-recommendations",
    teams: [buildTeamRecommendations(a, b, nameA), buildTeamRecommendations(b, a, nameB)],
  }
}
