import { describe, test, expect, vi, beforeAll } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { App } from "../App"
import { mockPlayerReport } from "./fixtures/mockData"

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

describe("App — интеграционные тесты", () => {
  // === ПРИМЕР 1: Рендеринг заголовка из данных ===
  test("отображает никнейм игрока в шапке", () => {
    render(<App data={mockPlayerReport} />)
    // mockPlayerReport.stats.playerProfile.nickname = "TestPlayer"
    expect(screen.getByText("TestPlayer")).toBeInTheDocument()
  })

  // === ПРИМЕР 2: Переключение табов по клику ===
  test("переключает таб при клике на 'Винрейт'", () => {
    render(<App data={mockPlayerReport} />)

    // По умолчанию активен первый таб "Баны/Пики"
    const winrateTab = screen.getByText("Винрейт")
    fireEvent.click(winrateTab)

    // После клика должна появиться таблица винрейта
    // В mockData есть карта de_dust2 с rate 67
    expect(screen.getByText("67%")).toBeInTheDocument()
  })

  // === НИЖЕ — ТЕСТЫ ДЛЯ СТУДЕНТОВ ===

  // TODO: Задание 7.1 — Тест: отображение всех табов в режиме "Как лидер"
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("отображает все 7 табов в режиме 'Как лидер'", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   // В режиме leader (по умолчанию) должны быть 7 табов:
  //   // "Баны/Пики", "Винрейт", "Тренды", "Матчи", "Обзор", "Радар", "Сравнение"
  //   expect(screen.getByText("Баны/Пики")).toBeInTheDocument()
  //   expect(screen.getByText("Винрейт")).toBeInTheDocument()
  //   expect(screen.getByText("Тренды")).toBeInTheDocument()
  //   expect(screen.getByText("Матчи")).toBeInTheDocument()
  //   expect(screen.getByText("Обзор")).toBeInTheDocument()
  //   expect(screen.getByText("Радар")).toBeInTheDocument()
  //   expect(screen.getByText("Сравнение")).toBeInTheDocument()
  // })

  // TODO: Задание 7.1 — Тест: переключение на режим "Все матчи"
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("при переключении на 'Все матчи' таб 'Баны/Пики' исчезает", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   // Найти кнопку "Все матчи" и кликнуть
  //   const allModeBtn = screen.getByText("Все матчи")
  //   fireEvent.click(allModeBtn)
  //
  //   // Таб "Баны/Пики" НЕ должен отображаться в режиме "all"
  //   expect(screen.queryByText("Баны/Пики")).not.toBeInTheDocument()
  //   // Остальные табы должны остаться
  //   expect(screen.getByText("Винрейт")).toBeInTheDocument()
  // })
  //
  // Подсказка: queryByText возвращает null если элемент не найден (не бросает ошибку)

  // TODO: Задание 7.1 — Тест: навигация по табу "Матчи"
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("таб 'Матчи' отображает таблицу с историей", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   fireEvent.click(screen.getByText("Матчи"))
  //
  //   // В mockData есть матчи с противниками "Team Alpha", "Team Beta", "Team Gamma"
  //   expect(screen.getByText(/Team Alpha/)).toBeInTheDocument()
  // })

  // TODO: Задание 7.1 — Тест: фильтрация матчей по карте
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("фильтр по карте в табе 'Матчи' обновляет список", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   fireEvent.click(screen.getByText("Матчи"))
  //
  //   // Найти select фильтра карт и выбрать "de_dust2"
  //   const mapFilter = screen.getByDisplayValue("Все карты")
  //   fireEvent.change(mapFilter, { target: { value: "de_dust2" } })
  //
  //   // Team Gamma играла на de_mirage → не должна быть видна
  //   expect(screen.queryByText(/Team Gamma/)).not.toBeInTheDocument()
  //   // Team Alpha играла на de_dust2 → должна быть видна
  //   expect(screen.getByText(/Team Alpha/)).toBeInTheDocument()
  // })

  // TODO: Задание 7.1 — Тест: фильтрация по результату (победы/поражения)
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("фильтр 'Победы' показывает только выигранные матчи", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   fireEvent.click(screen.getByText("Матчи"))
  //
  //   // Кликаем на кнопку "Победы"
  //   fireEvent.click(screen.getByText("Победы"))
  //
  //   // match-2 (Team Beta) — поражение, не должен отображаться
  //   expect(screen.queryByText(/Team Beta/)).not.toBeInTheDocument()
  //   // match-1 (Team Alpha) — победа, должен отображаться
  //   expect(screen.getByText(/Team Alpha/)).toBeInTheDocument()
  // })

  // TODO: Задание 7.1 — Тест: таб "Обзор" отображает сводные карточки
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("таб 'Обзор' показывает общий винрейт и количество матчей", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   fireEvent.click(screen.getByText("Обзор"))
  //
  //   // Должны быть видны карточки с метриками
  //   expect(screen.getByText("Всего матчей")).toBeInTheDocument()
  //   expect(screen.getByText("Общий винрейт")).toBeInTheDocument()
  // })

  // TODO: Задание 7.1 — Тест: таб "Обзор" показывает ELO в шкале уровня
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("таб 'Обзор' отображает текущий ELO и уровень", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   fireEvent.click(screen.getByText("Обзор"))
  //
  //   // В mockData: currentElo = 1835, skillLevel = 8
  //   expect(screen.getByText("1835")).toBeInTheDocument()
  // })

  // TODO: Задание 7.1 — Тест: переключение темы
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("кнопка темы переключает dark mode", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   // Найти кнопку переключения темы (иконка солнца/луны)
  //   // Подсказка: используйте screen.getByRole("button") или screen.getByLabelText
  //   // или найдите по тексту/иконке в ThemeToggle.tsx
  //
  //   // После клика document.documentElement должен содержать/не содержать класс "dark"
  // })

  // TODO: Задание 7.1 — Тест: раскрытие строки в таблице винрейта
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("клик по строке в WinRateTable раскрывает детали карты", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   fireEvent.click(screen.getByText("Винрейт"))
  //
  //   // Найти строку с картой de_dust2 и кликнуть
  //   // Подсказка: screen.getByText("de_dust2") → fireEvent.click
  //
  //   // После раскрытия должны появиться записи матчей
  //   // Подсказка: смотрите MatchList компонент — он рендерит счёт "16:12"
  // })

  // TODO: Задание 7.1 — Тест: таб "Сравнение" отображает форму ввода
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("таб 'Сравнение' показывает два поля ввода и кнопку", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   fireEvent.click(screen.getByText("Сравнение"))
  //
  //   // Должны быть видны два поля ввода и кнопка "Сравнить"
  //   expect(screen.getByPlaceholderText("Никнейм игрока 1")).toBeInTheDocument()
  //   expect(screen.getByPlaceholderText("Никнейм игрока 2")).toBeInTheDocument()
  //   expect(screen.getByText("Сравнить")).toBeInTheDocument()
  // })

  // TODO: Задание 7.1 — Тест: пагинация в табе "Матчи"
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // Подсказка: для этого теста нужно больше матчей в mockData (>20),
  // чтобы пагинация появилась. Можно создать расширенный fixture
  // с 25+ записями в matchRecords.
  //
  // test("пагинация в табе 'Матчи' переключает страницы", () => {
  //   // Создайте расширенные mockData с 25+ матчами
  //   // render(<App data={extendedMockReport} />)
  //   //
  //   // fireEvent.click(screen.getByText("Матчи"))
  //   //
  //   // // Должна быть кнопка "Далее →"
  //   // const nextBtn = screen.getByText("Далее →")
  //   // fireEvent.click(nextBtn)
  //   //
  //   // // Номер страницы должен обновиться
  //   // expect(screen.getByText("2 / 2")).toBeInTheDocument()
  // })

  // TODO: Задание 7.1 — Тест: рендеринг с пустыми данными
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("приложение корректно рендерится с минимальными данными", () => {
  //   const emptyData: ReportData = {
  //     type: "player",
  //     name: "EmptyPlayer",
  //     stats: {
  //       ...mockPlayerStats,
  //       mapWinRate: {},
  //       matchRecords: {},
  //       leaderMapWinRate: {},
  //       leaderMatchRecords: {},
  //       eloHistory: [],
  //       trends: [],
  //     },
  //   }
  //
  //   // Не должно бросить ошибку
  //   const { container } = render(<App data={emptyData} />)
  //   expect(container).toBeTruthy()
  //   expect(screen.getByText("EmptyPlayer")).toBeInTheDocument()
  // })
  //
  // Подсказка: import type { ReportData } from "../types"
  // import { mockPlayerStats } from "./fixtures/mockData"

  // TODO: Задание 7.1 — Тест: таб "Радар" рендерится без ошибок
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("таб 'Радар' отображает область для радарной диаграммы", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   fireEvent.click(screen.getByText("Радар"))
  //
  //   // Поскольку ECharts замокан, ищем data-testid="echarts-mock"
  //   expect(screen.getByTestId("echarts-mock")).toBeInTheDocument()
  // })

  // TODO: Задание 7.1 — Тест: режим "Все матчи" показывает "Эффект лидерства"
  // Документация: https://testing-library.com/docs/react-testing-library/api
  //
  // test("в режиме 'Все матчи' на табе 'Обзор' есть секция 'Эффект лидерства'", () => {
  //   render(<App data={mockPlayerReport} />)
  //
  //   // Переключить на "Все матчи"
  //   fireEvent.click(screen.getByText("Все матчи"))
  //
  //   // Перейти на "Обзор"
  //   fireEvent.click(screen.getByText("Обзор"))
  //
  //   // Должна быть секция "Эффект лидерства"
  //   expect(screen.getByText("Эффект лидерства")).toBeInTheDocument()
  // })
})
