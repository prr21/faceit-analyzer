import type {
  SearchPlayerResult,
  SearchTeamResult,
  TeamInfo,
} from "@faceit/core"
import type { ReportData } from "@/types"
import {
  mockPlayerReport,
  mockTeamReport,
} from "@/__tests__/fixtures/mockData"
import type { SearchAllResult } from "./player"

function delay(ms = 400): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const MOCK_PLAYERS: SearchPlayerResult[] = [
  { player_id: "1", nickname: "dErzz", avatar: "", country: "RU", skill_level: 8 },
  { player_id: "2", nickname: "ed1v9k", avatar: "", country: "RU", skill_level: 7 },
  { player_id: "3", nickname: "deNNis", avatar: "", country: "SE", skill_level: 10 },
  { player_id: "4", nickname: "developer", avatar: "", country: "US", skill_level: 5 },
]

const MOCK_TEAMS: SearchTeamResult[] = [
  { team_id: "c941c43c-67d9-4ea1-9f60-7c52f3adb39f", name: "Satanics Aura", avatar: "", verified: false },
  { team_id: "a1b2c3d4-5e6f-7890-abcd-ef0123456789", name: "Dev Team", avatar: "", verified: true },
]

const MOCK_ROSTER_BY_ID: Record<string, TeamInfo> = {
  "c941c43c-67d9-4ea1-9f60-7c52f3adb39f": {
    team_id: "c941c43c-67d9-4ea1-9f60-7c52f3adb39f",
    name: "Satanics Aura",
    avatar: "",
    members: [
      { player_id: "1", nickname: "dErzz", avatar: "", country: "RU", skill_level: 8 },
      { player_id: "2", nickname: "ed1v9k", avatar: "", country: "RU", skill_level: 7 },
      { player_id: "3", nickname: "deNNis", avatar: "", country: "SE", skill_level: 10 },
      { player_id: "5", nickname: "s1mple", avatar: "", country: "UA", skill_level: 10 },
      { player_id: "6", nickname: "NiKo", avatar: "", country: "BA", skill_level: 10 },
    ],
  },
  "a1b2c3d4-5e6f-7890-abcd-ef0123456789": {
    team_id: "a1b2c3d4-5e6f-7890-abcd-ef0123456789",
    name: "Dev Team",
    avatar: "",
    members: [
      { player_id: "4", nickname: "developer", avatar: "", country: "US", skill_level: 5 },
      { player_id: "7", nickname: "coder", avatar: "", country: "DE", skill_level: 6 },
      { player_id: "8", nickname: "designer", avatar: "", country: "FR", skill_level: 4 },
    ],
  },
}

export async function mockFetchPlayerReport(
  nickname: string,
): Promise<ReportData> {
  await delay()
  return {
    ...mockPlayerReport,
    name: nickname,
    stats: {
      ...mockPlayerReport.stats,
      playerProfile: {
        ...(mockPlayerReport.stats as { playerProfile?: { nickname: string; avatar?: string; skillLevel: number; currentElo: number; country?: string } }).playerProfile!,
        nickname,
      },
    },
  }
}

export async function mockSearchAll(query: string): Promise<SearchAllResult> {
  await delay(200)
  const lower = query.toLowerCase()
  return {
    players: MOCK_PLAYERS.filter(p => p.nickname.toLowerCase().includes(lower)),
    teams: MOCK_TEAMS.filter(t => t.name.toLowerCase().includes(lower)),
  }
}

export async function mockFetchTeamRoster(teamId: string): Promise<TeamInfo> {
  await delay(200)
  const info = MOCK_ROSTER_BY_ID[teamId]
  if (!info) {
    throw new Error(`Команда ${teamId} не найдена`)
  }
  return info
}

export async function mockAnalyzeTeam(
  teamName: string,
  _playerIds: string[],
): Promise<ReportData> {
  await delay(600)
  return { ...mockTeamReport, name: teamName }
}
