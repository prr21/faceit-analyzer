import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MatchHistoryTab } from "@/features/report/tabs/MatchHistoryTab"
import * as endpoints from "@/shared/api/endpoints"
import type { PlayerDropPickStats } from "@/shared/types"

vi.mock("@/shared/api/endpoints", async importOriginal => ({
  ...(await importOriginal<typeof endpoints>()),
  getVoiceStatus: vi.fn().mockResolvedValue({ status: "none" }),
  startVoiceExtraction: vi.fn(),
}))

// Минимальный stats: один матч на одной карте (остальные поля таб не читает)
const stats = {
  leaderMapWinRate: {},
  matchRecords: {
    de_mirage: [
      {
        matchId: "1-m",
        date: 1700000000,
        faceitUrl: "https://faceit.com/room/1-m",
        won: true,
        mapScore: "13:7",
        bestOf: 1,
        opponentName: "Foes",
      },
    ],
  },
} as unknown as PlayerDropPickStats

describe("MatchHistoryTab — интеграция голосов", () => {
  it("клик по 🎤 раскрывает VoicePanel", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <MatchHistoryTab stats={stats} isDark={false} />
      </QueryClientProvider>,
    )

    await userEvent.click(screen.getByRole("button", { name: "🎤" }))
    expect(await screen.findByText(/Извлечь голоса/)).toBeInTheDocument()
  })
})
