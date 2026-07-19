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
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    document.documentElement.classList.remove("dark")
  })

  test("по умолчанию тема светлая (если localStorage пуст и система светлая)", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.isDark).toBe(false)
  })

  test("localStorage 'dark' -> isDark === true", () => {
    localStorageMock.setItem("theme", "dark")
    const { result } = renderHook(() => useTheme())
    expect(result.current.isDark).toBe(true)
  })

  test("localStorage 'light' -> isDark === false, даже если система тёмная", () => {
    localStorageMock.setItem("theme", "light")
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    const { result } = renderHook(() => useTheme())
    expect(result.current.isDark).toBe(false)
  })

  test("toggleTheme переключает тему туда и обратно", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.isDark).toBe(false)

    act(() => result.current.toggleTheme())
    expect(result.current.isDark).toBe(true)

    act(() => result.current.toggleTheme())
    expect(result.current.isDark).toBe(false)
  })

  test("после toggleTheme тема сохраняется в localStorage", () => {
    const { result } = renderHook(() => useTheme())

    act(() => result.current.toggleTheme())
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark")

    act(() => result.current.toggleTheme())
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "light")
  })

  test("isDark управляет классом 'dark' на document.documentElement", () => {
    const { result } = renderHook(() => useTheme())
    expect(document.documentElement.classList.contains("dark")).toBe(false)

    act(() => result.current.toggleTheme())
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => result.current.toggleTheme())
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  test("localStorage пуст + системная тёмная тема -> isDark === true", () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    const { result } = renderHook(() => useTheme())
    expect(result.current.isDark).toBe(true)
  })
})
