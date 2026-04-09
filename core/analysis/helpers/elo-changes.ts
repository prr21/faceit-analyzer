import type { EloSnapshot, MatchRecord } from "../../types/index"

/** Заполняет eloChange в matchRecords на основе хронологически отсортированного eloHistory */
export function fillEloChanges(
  matchRecords: Record<string, MatchRecord[]>,
  eloHistory: EloSnapshot[],
): void {
  const eloChangeByMatchId = new Map<string, number>()
  for (let i = 0; i < eloHistory.length; i++) {
    const id = eloHistory[i].matchId
    if (!id) continue
    if (i === 0) {
      eloChangeByMatchId.set(id, 0)
    } else {
      eloChangeByMatchId.set(id, eloHistory[i].elo - eloHistory[i - 1].elo)
    }
  }

  for (const records of Object.values(matchRecords)) {
    for (const record of records) {
      const change = eloChangeByMatchId.get(record.matchId)
      if (change !== undefined) {
        record.eloChange = change
      }
    }
  }
}
