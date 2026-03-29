import { describe, test, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useTheme } from "../hooks/useTheme"

// Мок localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, "localStorage", { value: localStorageMock })

// Мок matchMedia
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, "matchMedia", { value: matchMediaMock, writable: true })

describe("useTheme", () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    document.documentElement.classList.remove("dark")
  })

  // Пример: тест начального состояния по умолчанию
  test("по умолчанию тема светлая (если localStorage пуст и система светлая)", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.isDark).toBe(false)
  })

  // TODO: Задание 6.1 — Добавьте тесты для хука useTheme
  // Документация: https://vitest.dev/api/, https://testing-library.com/docs/react-testing-library/api#renderhook
  //
  // Тесты, которые нужно написать:
  //
  // 1. Начальное состояние из localStorage:
  //    - Если localStorage содержит "dark" -> isDark === true
  //    - Если localStorage содержит "light" -> isDark === false
  //    Подсказка: вызовите localStorageMock.setItem("theme", "dark") ПЕРЕД renderHook
  //
  // 2. Переключение темы:
  //    - Вызов toggleTheme() меняет isDark с false на true
  //    - Повторный вызов toggleTheme() меняет обратно на false
  //    Подсказка: оберните вызов в act(() => { result.current.toggleTheme() })
  //
  // 3. Сохранение в localStorage:
  //    - После toggleTheme() значение сохраняется в localStorage
  //    Подсказка: проверьте localStorageMock.setItem.toHaveBeenCalledWith("theme", "dark")
  //
  // 4. CSS-класс на document:
  //    - Когда isDark === true, document.documentElement содержит класс "dark"
  //    - Когда isDark === false, класс "dark" отсутствует
  //    Подсказка: document.documentElement.classList.contains("dark")
  //
  // 5. Системные предпочтения (prefers-color-scheme):
  //    - Если localStorage пуст и matchMedia("(prefers-color-scheme: dark)").matches === true -> isDark === true
  //    Подсказка: перед renderHook настройте matchMediaMock:
  //    matchMediaMock.mockImplementation((query: string) => ({
  //      matches: query === "(prefers-color-scheme: dark)",
  //      ...остальные поля
  //    }))
})
