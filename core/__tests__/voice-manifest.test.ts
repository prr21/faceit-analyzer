import { describe, it, expect } from "vitest"
import {
  parseMatchId,
  extractSteamId,
  collectRoster,
  buildVoiceManifest,
} from "../voice/manifest"
import type { FaceitMatchDetail } from "../types/index"

describe("parseMatchId", () => {
  it("голый id проходит как есть", () => {
    expect(parseMatchId("1-abc123-def")).toBe("1-abc123-def")
  })

  it("достаёт id из ссылки на match room", () => {
    expect(
      parseMatchId("https://www.faceit.com/en/cs2/room/1-cb038819-b0d0-4471-b25c-0e7468ab1eb1/scoreboard"),
    ).toBe("1-cb038819-b0d0-4471-b25c-0e7468ab1eb1")
  })

  it("обрезает пробелы", () => {
    expect(parseMatchId("  1-abc  ")).toBe("1-abc")
  })
})

describe("extractSteamId", () => {
  it("достаёт 17-значный steamId из имени WAV", () => {
    expect(extractSteamId("C:/out/demo_76561198012345678.wav")).toBe("76561198012345678")
  })

  it("null, если steamId нет", () => {
    expect(extractSteamId("readme.txt")).toBeNull()
  })
})

function makeMatch(): FaceitMatchDetail {
  return {
    match_id: "1-m",
    started_at: 0,
    best_of: 1,
    teams: {
      faction1: { leader: "p1", roster: [{ player_id: "p1", nickname: "Alpha", faceit_url: "" }] },
      faction2: { leader: "p2", players: [{ player_id: "p2", nickname: "Bravo", faceit_url: "" }] },
    },
  }
}

describe("collectRoster", () => {
  it("собирает обе команды, roster с фолбэком на players", () => {
    expect(collectRoster(makeMatch())).toEqual([
      { playerId: "p1", nickname: "Alpha", faction: "faction1" },
      { playerId: "p2", nickname: "Bravo", faction: "faction2" },
    ])
  })
})

describe("buildVoiceManifest", () => {
  const roster = [
    { playerId: "p1", nickname: "Alpha", faction: "faction1" as const, steamId64: "76561198000000001" },
    { playerId: "p2", nickname: "Bravo", faction: "faction2" as const, steamId64: null },
  ]

  it("мапит mp3 на игроков по steamId", () => {
    const m = buildVoiceManifest("1-m", roster, [
      { steamId64: "76561198000000001", filePath: "76561198000000001.mp3", fileSize: 100 },
    ])
    expect(m.matchId).toBe("1-m")
    expect(m.mode).toBe("split-compact")
    expect(m.players).toHaveLength(1)
    expect(m.players[0]).toMatchObject({ playerId: "p1", nickname: "Alpha", faction: "faction1" })
  })

  it("пропускает файлы не из ростера, пустой список валиден", () => {
    const m = buildVoiceManifest("1-m", roster, [
      { steamId64: "76561198999999999", filePath: "x.mp3", fileSize: 5 },
    ])
    expect(m.players).toEqual([])
  })
})
