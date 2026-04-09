import { ACTIVE_MAP_POOL } from "../../constants"
import type { VotingEntity, VotingPayload, VotingTicket } from "../../types/index"
import type { VotingPhase } from "../../types/analysis"

export function findMapVotingTicket(
  history: VotingPayload,
): VotingTicket | undefined {
  return history.tickets?.find(ticket => ticket.entity_type === "map")
}

const defaultPool = new Set(ACTIVE_MAP_POOL)

export function isPoolMap(mapName: string, pool: Set<string> = defaultPool): boolean {
  return pool.has(mapName)
}

export function getDeciderRound(ticket: VotingTicket): number {
  return ticket.entities.at(-1)!.round
}

export function classifyVotingEntity(
  entity: VotingEntity,
  deciderRound: number,
): VotingPhase | null {
  const { round, status } = entity

  if (round === deciderRound) return "decider"

  const isStep1 = round === 1 || round === 2
  const isStep2 = round === 3 || round === 4
  const isStep3 = round === 5 || round === 6

  if (isStep1 && status === "drop") return "firstBan"
  if (isStep2 && status === "pick") return "firstPick"
  if (isStep2 && status === "drop") return "secondBan"
  if (isStep3 && status === "drop") return "thirdBan"

  return null
}
