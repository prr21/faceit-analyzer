import type { ReportData, PlayerDropPickStats, TeamDropPickStats } from "@/shared/types"

// Реалистичные тестовые данные для player-отчёта
export const mockPlayerStats: PlayerDropPickStats = {
  stats: {
    firstBan: { de_inferno: 5, de_mirage: 3 },
    firstPick: { de_dust2: 4, de_nuke: 2 },
    secondBan: { de_ancient: 3, de_anubis: 2 },
    thirdBan: { de_vertigo: 1 },
  },
  decider: { de_dust2: 2, de_mirage: 1 },
  mapWinRate: {
    de_dust2: { wins: 8, losses: 4, total: 12, rate: 67 },
    de_mirage: { wins: 5, losses: 7, total: 12, rate: 42 },
    de_inferno: { wins: 3, losses: 2, total: 5, rate: 60 },
    de_nuke: { wins: 1, losses: 1, total: 2, rate: 50 },
  },
  deciderWinRate: {
    de_dust2: { wins: 1, losses: 1, total: 2, rate: 50 },
  },
  eloHistory: [
    { date: 1710000000, elo: 1800, result: "win" },
    { date: 1710100000, elo: 1825, result: "win" },
    { date: 1710200000, elo: 1810, result: "loss" },
    { date: 1710300000, elo: 1835, result: "win" },
  ],
  favoriteUnderdog: {
    asFavorite: { wins: 10, losses: 5, total: 15, rate: 67 },
    asUnderdog: { wins: 5, losses: 8, total: 13, rate: 38 },
  },
  competitionStats: {
    "5v5 PREMIUM": { wins: 10, losses: 6, total: 16, rate: 63 },
    "CS2 5v5": { wins: 7, losses: 8, total: 15, rate: 47 },
  },
  matchRecords: {
    de_dust2: [
      {
        matchId: "match-1",
        date: 1710300000,
        faceitUrl: "https://faceit.com/match/1",
        won: true,
        mapScore: "16:12",
        bestOf: 1,
        opponentName: "Team Alpha",
        kills: 22,
        deaths: 15,
        assists: 4,
        headshots: 10,
        headshotPercent: 45,
        adr: 85.5,
        kdRatio: 1.47,
        eloChange: 25,
      },
      {
        matchId: "match-2",
        date: 1710200000,
        faceitUrl: "https://faceit.com/match/2",
        won: false,
        mapScore: "14:16",
        bestOf: 1,
        opponentName: "Team Beta",
        kills: 18,
        deaths: 20,
        assists: 3,
        headshots: 8,
        headshotPercent: 44,
        adr: 72.3,
        kdRatio: 0.9,
        eloChange: -15,
      },
    ],
    de_mirage: [
      {
        matchId: "match-3",
        date: 1710100000,
        faceitUrl: "https://faceit.com/match/3",
        won: true,
        mapScore: "16:10",
        bestOf: 1,
        opponentName: "Team Gamma",
        kills: 25,
        deaths: 12,
        assists: 5,
        headshots: 14,
        headshotPercent: 56,
        adr: 92.1,
        kdRatio: 2.08,
        eloChange: 25,
      },
    ],
  },
  leaderMapWinRate: {
    de_dust2: { wins: 5, losses: 2, total: 7, rate: 71 },
    de_mirage: { wins: 3, losses: 4, total: 7, rate: 43 },
  },
  leaderMatchRecords: {
    de_dust2: [
      {
        matchId: "match-1",
        date: 1710300000,
        faceitUrl: "https://faceit.com/match/1",
        won: true,
        mapScore: "16:12",
        bestOf: 1,
        opponentName: "Team Alpha",
        kills: 22,
        deaths: 15,
        assists: 4,
        headshots: 10,
        headshotPercent: 45,
        adr: 85.5,
        kdRatio: 1.47,
        eloChange: 25,
      },
    ],
  },
  avgElo: 1818,
  trends: [],
  earliestGame: "10.03.2024",
  latestGame: "13.03.2024",
  mapInfo: "Пул карт: de_dust2, de_mirage, de_inferno, de_nuke",
  count: 14,
  allCount: 31,
  playerProfile: {
    nickname: "TestPlayer",
    avatar: "https://example.com/avatar.jpg",
    skillLevel: 8,
    currentElo: 1835,
    country: "RU",
  },
  longestWinStreak: 4,
  currentStreak: { type: "win", count: 1 },
}

export const mockPlayerReport: ReportData = {
  type: "player",
  name: "TestPlayer",
  stats: mockPlayerStats,
}

export const mockTeamStats: TeamDropPickStats = {
  target: {
    firstBan: { de_vertigo: 4, de_anubis: 3 },
    firstPick: { de_mirage: 5, de_inferno: 3 },
    secondBan: { de_ancient: 2, de_nuke: 2 },
    thirdBan: { de_overpass: 1 },
  },
  enemy: {
    firstBan: { de_mirage: 3, de_inferno: 2 },
    firstPick: { de_dust2: 4 },
    secondBan: { de_anubis: 2 },
    thirdBan: {},
  },
  decider: { de_dust2: 2, de_mirage: 1 },
  mapWinRate: {
    de_mirage: { wins: 6, losses: 2, total: 8, rate: 75 },
    de_inferno: { wins: 3, losses: 4, total: 7, rate: 43 },
    de_dust2: { wins: 2, losses: 3, total: 5, rate: 40 },
  },
  deciderWinRate: {
    de_dust2: { wins: 1, losses: 1, total: 2, rate: 50 },
  },
  eloHistory: [
    { date: 1710000000, elo: 1750, result: "win" },
    { date: 1710100000, elo: 1780, result: "win" },
    { date: 1710200000, elo: 1760, result: "loss" },
  ],
  favoriteUnderdog: {
    asFavorite: { wins: 7, losses: 3, total: 10, rate: 70 },
    asUnderdog: { wins: 4, losses: 6, total: 10, rate: 40 },
  },
  competitionStats: {
    "5v5 PREMIUM": { wins: 8, losses: 5, total: 13, rate: 62 },
    "CS2 5v5": { wins: 3, losses: 4, total: 7, rate: 43 },
  },
  matchRecords: {},
  avgElo: 1763,
  trends: [],
  earliestGame: "10.03.2024",
  latestGame: "13.03.2024",
  mapInfo: "Пул карт: de_mirage, de_inferno, de_dust2",
  count: 20,
  allCount: 35,
}

export const mockTeamReport: ReportData = {
  type: "team",
  name: "Mock Team",
  stats: mockTeamStats,
}
