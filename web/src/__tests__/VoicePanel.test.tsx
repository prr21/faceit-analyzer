import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { VoicePanel } from "@/features/voice/ui/VoicePanel"
import * as endpoints from "@/shared/api/endpoints"
import type { VoiceStatusDto } from "@/shared/types"

vi.mock("@/shared/api/endpoints", async importOriginal => ({
  ...(await importOriginal<typeof endpoints>()),
  getVoiceStatus: vi.fn(),
  startVoiceExtraction: vi.fn(),
}))

const mockedGet = vi.mocked(endpoints.getVoiceStatus)
const mockedStart = vi.mocked(endpoints.startVoiceExtraction)

function renderPanel(props: Partial<Parameters<typeof VoicePanel>[0]> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <VoicePanel matchId="1-m" {...props} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("VoicePanel", () => {
  it("status none → кнопка запуска, клик стартует извлечение", async () => {
    mockedGet.mockResolvedValue({ status: "none" })
    mockedStart.mockResolvedValue({ status: "pending" })
    renderPanel()

    const button = await screen.findByRole("button", { name: /Извлечь голоса/ })
    await userEvent.click(button)
    expect(mockedStart).toHaveBeenCalledWith("1-m")
  })

  it("status extracting → индикатор шага", async () => {
    mockedGet.mockResolvedValue({ status: "extracting", step: "extract" })
    renderPanel()
    expect(await screen.findByText(/Извлечение голосов/)).toBeInTheDocument()
  })

  it("status done → плееры по командам, целевой игрок подсвечен", async () => {
    const status: VoiceStatusDto = {
      status: "done",
      players: [
        { playerId: "p1", nickname: "Alpha", steamId64: "76561198000000001", faction: "faction1", fileSize: 1000, url: "/api/match/1-m/voices/76561198000000001.mp3" },
        { playerId: "p2", nickname: "Bravo", steamId64: "76561198000000002", faction: "faction2", fileSize: 2000, url: "/api/match/1-m/voices/76561198000000002.mp3" },
      ],
    }
    mockedGet.mockResolvedValue(status)
    renderPanel({ highlightNickname: "alpha" })

    expect(await screen.findByText(/Alpha/)).toBeInTheDocument()
    expect(screen.getByText(/Bravo/)).toBeInTheDocument()
    expect(screen.getByText(/Alpha/).textContent).toContain("⭐")
  })

  it("status done без игроков → «Голоса не найдены»", async () => {
    mockedGet.mockResolvedValue({ status: "done", players: [] })
    renderPanel()
    expect(await screen.findByText(/Голоса не найдены/)).toBeInTheDocument()
  })

  it("status error → сообщение и кнопка «Повторить»", async () => {
    mockedGet.mockResolvedValue({ status: "error", error: "Демка недоступна" })
    renderPanel()
    expect(await screen.findByText(/Демка недоступна/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Повторить/ })).toBeInTheDocument()
  })
})
