import { describe, test, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MatchPage } from "@/pages/MatchPage"
import type {
  MatchAnalysisResult,
  MatchTeamAnalysis,
  TeamDropPickStats,
  TeamRecommendations,
} from "@/shared/types"

const fetchMatchAnalysis = vi.hoisted(() => vi.fn())
const streamMatchChat = vi.hoisted(() => vi.fn())
vi.mock("@/shared/api/endpoints", async importOriginal => ({
  ...(await importOriginal<typeof import("@/shared/api/endpoints")>()),
  fetchMatchAnalysis,
  streamMatchChat,
}))

function makeStats(overrides: Partial<TeamDropPickStats> = {}): TeamDropPickStats {
  const emptyFaction = { firstBan: {}, firstPick: {}, secondBan: {}, thirdBan: {} }
  const emptyWr = { wins: 0, losses: 0, total: 0, rate: 0 }
  return {
    target: { ...emptyFaction },
    enemy: { ...emptyFaction },
    decider: {},
    mapWinRate: {},
    deciderWinRate: {},
    eloHistory: [],
    favoriteUnderdog: { asFavorite: emptyWr, asUnderdog: emptyWr },
    competitionStats: {},
    matchRecords: {},
    avgElo: 2500,
    trends: [],
    earliestGame: "",
    latestGame: "",
    mapInfo: "",
    count: 20,
    allCount: 20,
    ...overrides,
  }
}

function makeTeam(name: string): MatchTeamAnalysis {
  return {
    factionId: undefined,
    name,
    leader: "p1",
    avgElo: 2500,
    roster: [
      {
        playerId: "p1",
        nickname: `${name}-игрок`,
        skillLevel: 10,
        mapStats: [
          { map: "de_mirage", matches: 30, wins: 18, winRate: 60, avgKd: 1.2, adr: 85 },
        ],
      },
    ],
    stats: makeStats({
      mapWinRate: { de_mirage: { wins: 12, losses: 4, total: 16, rate: 75 } },
    }),
    mapHabits: { de_mirage: { pickRate: 0.5, banRate: 0.1 } },
  }
}

function makeRecs(teamName: string): TeamRecommendations {
  return {
    teamName,
    picks: [
      {
        map: "de_mirage",
        score: 0.4,
        reason: "винрейт выше, чем у соперника",
        factors: [
          { key: "edge", label: "Преимущество по винрейту", value: 0.8, weight: 0.5, contribution: 0.4 },
        ],
      },
    ],
    bans: [
      {
        map: "de_nuke",
        score: 0.3,
        reason: "соперник любит пикать эту карту",
        factors: [],
      },
    ],
    lowData: false,
  }
}

const mockResult: MatchAnalysisResult = {
  matchId: "1-abc",
  bestOf: 3,
  competitionName: "Test Cup",
  teams: [makeTeam("Alpha"), makeTeam("Bravo")],
  insights: [
    { type: "map-recommendations", teams: [makeRecs("Alpha"), makeRecs("Bravo")] },
  ],
}

function renderMatchPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/match/1-abc"]}>
        <Routes>
          <Route path="/match/:matchId" element={<MatchPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("MatchPage", () => {
  beforeEach(() => {
    fetchMatchAnalysis.mockReset()
    streamMatchChat.mockReset()
  })

  test("показывает спиннер во время анализа", () => {
    fetchMatchAnalysis.mockReturnValue(new Promise(() => {}))
    renderMatchPage()
    expect(screen.getByText(/Анализируем обе команды/)).toBeInTheDocument()
  })

  test("рендерит команды, рекомендации, сравнение карт и ростеры", async () => {
    fetchMatchAnalysis.mockResolvedValue(mockResult)
    renderMatchPage()

    // Заголовок: обе команды + турнир
    expect(await screen.findAllByText("Alpha")).not.toHaveLength(0)
    expect(screen.getAllByText("Bravo").length).toBeGreaterThan(0)
    expect(screen.getByText("Test Cup")).toBeInTheDocument()

    // Рекомендации обеих команд
    expect(screen.getAllByText("Что пикать")).toHaveLength(2)
    expect(screen.getAllByText("Что банить")).toHaveLength(2)
    expect(screen.getAllByText(/винрейт выше, чем у соперника/).length).toBeGreaterThan(0)

    // Сравнение карт: винрейт из mapWinRate
    expect(screen.getAllByText("75%").length).toBeGreaterThan(0)

    // Ростеры с игроками
    expect(screen.getByText("Alpha-игрок")).toBeInTheDocument()
    expect(screen.getByText("Bravo-игрок")).toBeInTheDocument()
  })

  test("показывает ошибку при падении анализа", async () => {
    fetchMatchAnalysis.mockRejectedValue(new Error("Матч не найден"))
    renderMatchPage()
    expect(await screen.findByText("Матч не найден")).toBeInTheDocument()
  })

  test("переключение в AI-режим открывает чат и стримит выжимку", async () => {
    fetchMatchAnalysis.mockResolvedValue(mockResult)
    streamMatchChat.mockImplementation(
      async (_id, _res, _msgs, onToken: (t: string) => void) => onToken("Выжимка"),
    )
    renderMatchPage()

    await screen.findAllByText("Alpha")
    fireEvent.click(screen.getByText("AI-режим"))

    expect(await screen.findByText("Выжимка")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Спросите про этот матч/)).toBeInTheDocument()
    // анализ скрыт
    expect(screen.queryAllByText("Что пикать")).toHaveLength(0)
    // первый запрос — с пустым messages (сервер сам подставит выжимку)
    expect(streamMatchChat.mock.calls[0][2]).toEqual([])
  })

  test("вопрос пользователя уходит в чат с историей", async () => {
    fetchMatchAnalysis.mockResolvedValue(mockResult)
    streamMatchChat.mockImplementation(
      async (_id, _res, _msgs, onToken: (t: string) => void) => onToken("ответ"),
    )
    renderMatchPage()

    await screen.findAllByText("Alpha")
    fireEvent.click(screen.getByText("AI-режим"))
    await screen.findByText("ответ") // выжимка отстримилась, стриминг завершён

    fireEvent.change(screen.getByPlaceholderText(/Спросите про этот матч/), {
      target: { value: "Кто фаворит?" },
    })
    fireEvent.click(screen.getByText("Отправить"))

    await waitFor(() => expect(streamMatchChat).toHaveBeenCalledTimes(2))
    const sent = streamMatchChat.mock.calls[1][2]
    expect(sent.at(-1)).toEqual({ role: "user", content: "Кто фаворит?" })
    expect(await screen.findByText("Кто фаворит?")).toBeInTheDocument()
  })
})
