import { describe, test, expect, vi, beforeAll, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReportView } from "@/features/report/ReportView"
import type { ReportData } from "@/shared/types"
import { mockPlayerReport, mockPlayerStats } from "@/shared/fixtures/mockData"

// Мок для ECharts — в тестовой среде нет canvas, поэтому мокаем компонент
vi.mock("echarts-for-react", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    <div data-testid="echarts-mock" data-option={JSON.stringify(props.option)} />
  ),
}))

// Мок для ResizeObserver (не реализован в jsdom)
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

/** Хелпер: рендерит ReportView с провайдерами (Router + QueryClient) */
function renderWithProviders(data: ReportData, initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/report/:tab?"
            element={<ReportView data={data} basePath="/report" />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Хелпер: рендерит стандартный player-отчёт на нужном табе */
function renderReport(tab = "bans", mode?: string) {
  const modeParam = mode ? `?mode=${mode}` : ""
  return renderWithProviders(mockPlayerReport, `/report/${tab}${modeParam}`)
}

describe("App — интеграционные тесты", () => {
  beforeEach(() => {
    // useTheme пишет в localStorage и на documentElement — изолируем тесты
    try {
      window.localStorage.removeItem("theme")
    } catch {
      // jsdom без localStorage — useTheme сам обрабатывает это через try/catch
    }
    document.documentElement.classList.remove("dark")
  })

  test("отображает никнейм игрока в шапке", () => {
    renderReport()
    expect(screen.getByText("TestPlayer")).toBeInTheDocument()
  })

  test("переключает таб при клике на 'Винрейт'", () => {
    renderReport()

    const winrateTab = screen.getByText("Винрейт")
    fireEvent.click(winrateTab)

    // В mockData leaderMapWinRate de_dust2 rate = 71
    expect(screen.getByText("71%")).toBeInTheDocument()
  })

  test("отображает все 7 табов в режиме 'Как лидер'", () => {
    renderReport()

    for (const label of [
      "Баны/Пики",
      "Винрейт",
      "Тренды",
      "Матчи",
      "Обзор",
      "Радар",
      "Сравнение",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  test("при переключении на 'Все матчи' таб 'Баны/Пики' исчезает", () => {
    renderReport()

    fireEvent.click(screen.getByText("Все матчи"))

    expect(screen.queryByText("Баны/Пики")).not.toBeInTheDocument()
    // "Винрейт" есть и в табах, и в заголовке контента
    expect(screen.getAllByText("Винрейт").length).toBeGreaterThan(0)
  })

  test("таб 'Матчи' отображает таблицу с историей", () => {
    renderReport("matches", "all")

    expect(screen.getByText(/Team Alpha/)).toBeInTheDocument()
    expect(screen.getByText(/Team Gamma/)).toBeInTheDocument()
  })

  test("фильтр по карте в табе 'Матчи' обновляет список", () => {
    renderReport("matches", "all")

    const mapFilter = screen.getByDisplayValue("Все карты")
    fireEvent.change(mapFilter, { target: { value: "de_dust2" } })

    // Team Gamma играла на de_mirage → не должна быть видна
    expect(screen.queryByText(/Team Gamma/)).not.toBeInTheDocument()
    expect(screen.getByText(/Team Alpha/)).toBeInTheDocument()
  })

  test("фильтр 'Победы' показывает только выигранные матчи", () => {
    renderReport("matches", "all")

    fireEvent.click(screen.getByText("Победы"))

    // match-2 (Team Beta) — поражение, не должен отображаться
    expect(screen.queryByText(/Team Beta/)).not.toBeInTheDocument()
    expect(screen.getByText(/Team Alpha/)).toBeInTheDocument()
  })

  test("таб 'Обзор' показывает общий винрейт и количество матчей", () => {
    renderReport("overview")

    expect(screen.getAllByText("Всего матчей").length).toBeGreaterThan(0)
    expect(screen.getByText("Общий винрейт")).toBeInTheDocument()
  })

  test("таб 'Обзор' отображает текущий ELO", () => {
    renderReport("overview")

    // В mockData: playerProfile.currentElo = 1835
    expect(screen.getAllByText("1835").length).toBeGreaterThan(0)
  })

  test("кнопка темы переключает dark mode", () => {
    renderReport()

    expect(document.documentElement.classList.contains("dark")).toBe(false)

    fireEvent.click(screen.getByTitle("Тёмная тема"))
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    fireEvent.click(screen.getByTitle("Светлая тема"))
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  test("клик по строке в WinRateTable раскрывает детали карты", () => {
    renderReport("winrate")

    // В leaderMatchRecords de_dust2 есть матч со счётом 16:12
    expect(screen.queryByText("16:12")).not.toBeInTheDocument()

    fireEvent.click(screen.getByText("de_dust2"))
    expect(screen.getByText("16:12")).toBeInTheDocument()
  })

  test("таб 'Сравнение' показывает два поля ввода и кнопку", () => {
    renderReport("compare")

    expect(screen.getByPlaceholderText("Никнейм игрока 1")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Никнейм игрока 2")).toBeInTheDocument()
    expect(screen.getByText("Сравнить")).toBeInTheDocument()
  })

  test("приложение корректно рендерится с минимальными данными", () => {
    const emptyData: ReportData = {
      type: "player",
      name: "EmptyPlayer",
      stats: {
        ...mockPlayerStats,
        mapWinRate: {},
        matchRecords: {},
        leaderMapWinRate: {},
        leaderMatchRecords: {},
        eloHistory: [],
        trends: [],
      },
    }

    const { container } = renderWithProviders(emptyData, "/report/bans")

    expect(container).toBeTruthy()
    // PlayerHeader рендерит никнейм из playerProfile
    expect(screen.getByText("TestPlayer")).toBeInTheDocument()
  })

  test("таб 'Радар' отображает область для радарной диаграммы", () => {
    renderReport("radar")

    expect(screen.getAllByTestId("echarts-mock").length).toBeGreaterThan(0)
  })

  test("в режиме 'Все матчи' на табе 'Обзор' есть секция 'Эффект лидерства'", () => {
    renderReport("overview", "all")

    expect(screen.getByText("Эффект лидерства")).toBeInTheDocument()
  })
})
