// Типы рекомендаций для пре-матч анализа

export interface FactorContribution {
  key: string // "edge" | "own" | "availability" | "oppEdge" | "threat" | "intent" | "decider"
  label: string // русская подпись фактора
  value: number // нормализованное значение фактора, ~[-1, 1]
  weight: number
  contribution: number // value * weight
  detail?: string // "62% (13 матчей) против 41% (8)"
}

export interface MapRecommendation {
  map: string
  score: number
  reason: string // человекочитаемое обоснование из топ-факторов
  factors: FactorContribution[]
}

export interface TeamRecommendations {
  teamName: string
  picks: MapRecommendation[] // отсортированы по score desc
  bans: MapRecommendation[] // отсортированы по score desc
  lowData: boolean // мало матчей у одной из команд — рекомендации ненадёжны
}

// Инсайты матча — discriminated union, расширяется новыми типами
// (например, предсказание пистолетных раундов)
export interface MapRecommendationsInsight {
  type: "map-recommendations"
  teams: [TeamRecommendations, TeamRecommendations] // порядок = faction1, faction2
}

export type MatchInsight = MapRecommendationsInsight
