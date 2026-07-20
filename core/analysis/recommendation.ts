import { ACTIVE_MAP_POOL, ACTIVE_MAP_POOL_META } from "../constants"
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
  avoidance: {
    establishedMonths: 4, // старше — «мало данных» трактуется как избегание
    underplayThreshold: 0.4, // доля игр ниже 0.4× ожидаемой = недоигрывание
    pickWeight: 0.15,
    banWeight: 0.2,
  },
} as const

const MONTH_MS = 1000 * 60 * 60 * 24 * 30.44
const MAP_ADDED_AT = new Map(ACTIVE_MAP_POOL_META.map(m => [m.id, Date.parse(m.addedAt)]))

/** Сколько месяцев карта в активном пуле. Не в мете → считаем давно существующей. */
export function mapTenureMonths(map: string, now: number = Date.now()): number {
  const added = MAP_ADDED_AT.get(map)
  if (added === undefined || Number.isNaN(added)) return Infinity
  return (now - added) / MONTH_MS
}

/** Карта давно в пуле — по ней уже должна быть накоплена статистика. */
export function isEstablishedMap(map: string, now: number = Date.now()): boolean {
  return mapTenureMonths(map, now) >= RECO_WEIGHTS.avoidance.establishedMonths
}

function totalMapPlays(stats: TeamDropPickStats): number {
  return Object.values(stats.mapWinRate).reduce((acc, wr) => acc + wr.total, 0)
}

/**
 * Сигнал избегания карты (0..1): карта давно в пуле, но команда её почти не
 * играет → дискомфорт. Для недавно добавленных карт всегда 0 (просто не успели
 * наиграть). Масштабируется объёмом данных, чтобы не шуметь на малых выборках.
 */
export function avoidanceSignal(
  stats: TeamDropPickStats,
  map: string,
  now: number = Date.now(),
  poolSize: number = ACTIVE_MAP_POOL.length,
): number {
  if (!isEstablishedMap(map, now)) return 0
  const total = totalMapPlays(stats)
  if (total === 0) return 0
  const dataScale = Math.min(1, stats.count / RECO_WEIGHTS.habitMinMatches)
  const expected = 1 / poolSize
  const share = (stats.mapWinRate[map]?.total ?? 0) / total
  const threshold = RECO_WEIGHTS.avoidance.underplayThreshold * expected
  if (share >= threshold) return 0
  const deficit = (threshold - share) / threshold
  return Math.max(0, Math.min(1, deficit * dataScale))
}

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
  avoidPick: {
    positive: "команда любит эту карту",
    negative: "команда избегает эту карту",
  },
  avoidBanOwn: {
    positive: "команда избегает эту карту — вероятный бан",
    negative: "команда уверенно играет эту карту",
  },
  avoidBanOpp: {
    positive: "соперник часто играет эту карту",
    negative: "соперник избегает эту карту — оставьте её открытой",
  },
}

function buildReason(factors: FactorContribution[], fallback: string): string {
  const top = [...factors]
    .filter(f => Math.abs(f.contribution) > 0.01)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 2)
  if (top.length === 0) return fallback
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

function lowDataFallback(map: string, now: number): string {
  return isEstablishedMap(map, now)
    ? "недостаточно данных для уверенного вывода"
    : "карта недавно в пуле — статистика ещё копится"
}

/**
 * Скоринг карты для пика командой own против opp.
 * Все факторы нормализованы к ~[-1, 1].
 */
function scorePick(
  own: TeamDropPickStats,
  opp: TeamDropPickStats,
  map: string,
  now: number,
  poolSize: number,
): MapRecommendation {
  const w = RECO_WEIGHTS.pick
  const wrOwn = shrunkWinRate(own.mapWinRate[map])
  const wrOpp = shrunkWinRate(opp.mapWinRate[map])
  const habitScaleOpp = Math.min(1, opp.count / RECO_WEIGHTS.habitMinMatches)
  const oppBan = banRate(opp.target, map)
  const avoidOwn = avoidanceSignal(own, map, now, poolSize)
  const ownPlays = own.mapWinRate[map]?.total ?? 0

  const factors: FactorContribution[] = [
    factor("edge", "Преимущество по винрейту", 2 * (wrOwn - wrOpp), w.edge, wrDetail(own.mapWinRate[map], opp.mapWinRate[map])),
    factor("own", "Собственный винрейт", 2 * (wrOwn - 0.5), w.own, wrDetail(own.mapWinRate[map], undefined)),
    factor("availability", "Риск бана соперником", -oppBan * habitScaleOpp, w.availability, `банит в ${pct(oppBan)} вето`),
    factor("avoidPick", "Избегание карты командой", -avoidOwn, RECO_WEIGHTS.avoidance.pickWeight, avoidOwn > 0 ? `сыграна ${ownPlays} раз` : undefined),
  ]

  const score = factors.reduce((acc, f) => acc + f.contribution, 0)
  return { map, score, reason: buildReason(factors, lowDataFallback(map, now)), factors }
}

/**
 * Скоринг карты для бана командой own против opp:
 * опасность карты, намерение соперника её пикать, сила соперника в десайдерах,
 * избегание карты (своё — банить, соперника — оставить открытой).
 */
function scoreBan(
  own: TeamDropPickStats,
  opp: TeamDropPickStats,
  map: string,
  now: number,
  poolSize: number,
): MapRecommendation {
  const w = RECO_WEIGHTS.ban
  const wrOwn = shrunkWinRate(own.mapWinRate[map])
  const wrOpp = shrunkWinRate(opp.mapWinRate[map])
  const habitScaleOpp = Math.min(1, opp.count / RECO_WEIGHTS.habitMinMatches)
  const oppPick = pickRate(opp.target, map)
  const oppDeciderRate = deciderRate(opp.decider, map)
  const oppDeciderWr = shrunkWinRate(opp.deciderWinRate[map])
  const avoidOwn = avoidanceSignal(own, map, now, poolSize)
  const avoidOpp = avoidanceSignal(opp, map, now, poolSize)
  const ownPlays = own.mapWinRate[map]?.total ?? 0
  const oppPlays = opp.mapWinRate[map]?.total ?? 0

  const factors: FactorContribution[] = [
    factor("oppEdge", "Преимущество соперника", 2 * (wrOpp - wrOwn), w.oppEdge, wrDetail(opp.mapWinRate[map], own.mapWinRate[map])),
    factor("threat", "Сила соперника на карте", 2 * (wrOpp - 0.5), w.threat, wrDetail(opp.mapWinRate[map], undefined)),
    factor("intent", "Намерение соперника пикать", oppPick * habitScaleOpp, w.intent, `пикает в ${pct(oppPick)} вето`),
    factor("decider", "Десайдер соперника", oppDeciderRate * 2 * (oppDeciderWr - 0.5), w.decider),
    factor("avoidBanOwn", "Своё избегание карты", avoidOwn, RECO_WEIGHTS.avoidance.banWeight, avoidOwn > 0 ? `сыграна ${ownPlays} раз` : undefined),
    factor("avoidBanOpp", "Избегание карты соперником", -avoidOpp, RECO_WEIGHTS.avoidance.banWeight, avoidOpp > 0 ? `соперник сыграл ${oppPlays} раз` : undefined),
  ]

  const score = factors.reduce((acc, f) => acc + f.contribution, 0)
  return { map, score, reason: buildReason(factors, lowDataFallback(map, now)), factors }
}

export function buildTeamRecommendations(
  own: TeamDropPickStats,
  opp: TeamDropPickStats,
  teamName: string,
  pool: string[] = ACTIVE_MAP_POOL,
  now: number = Date.now(),
): TeamRecommendations {
  const picks = pool
    .map(map => scorePick(own, opp, map, now, pool.length))
    .sort((a, b) => b.score - a.score)
  const bans = pool
    .map(map => scoreBan(own, opp, map, now, pool.length))
    .sort((a, b) => b.score - a.score)
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
  now: number = Date.now(),
): MapRecommendationsInsight {
  return {
    type: "map-recommendations",
    teams: [
      buildTeamRecommendations(a, b, nameA, ACTIVE_MAP_POOL, now),
      buildTeamRecommendations(b, a, nameB, ACTIVE_MAP_POOL, now),
    ],
  }
}
