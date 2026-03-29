import { describe, test, expect } from "vitest"
import { getStatColor, getStatBgColor } from "../utils/colors"

describe("getStatColor", () => {
  // Пример: тест для высокого винрейта -> зелёный цвет
  test("возвращает зелёный для винрейта >= 55%", () => {
    expect(getStatColor(60, "winRate")).toContain("green")
  })

  // Пример: тест для низкого K/D -> красный цвет
  test("возвращает красный для K/D < 0.8", () => {
    expect(getStatColor(0.5, "kd")).toContain("red")
  })

  // TODO: Задание 6.1 — Добавьте тесты для всех порогов каждого типа статистики
  // Документация: https://vitest.dev/api/
  //
  // Что нужно протестировать:
  // - winRate: >= 55 (зелёный), >= 50 (серый), >= 40 (оранжевый), < 40 (красный)
  // - kd: >= 1.1, >= 1.0, >= 0.8, < 0.8
  // - adr: >= 85, >= 75, >= 60, < 60
  // - hs: >= 55, >= 45, >= 35, < 35
  //
  // Подсказка: используйте test.each для параметризованных тестов:
  //
  // test.each([
  //   [60, "winRate", "green"],
  //   [52, "winRate", "gray"],
  //   [45, "winRate", "orange"],
  //   [30, "winRate", "red"],
  // ] as const)("getStatColor(%i, %s) содержит %s", (value, type, expected) => {
  //   expect(getStatColor(value, type)).toContain(expected)
  // })
  //
  // Граничные значения: проверьте точные пороги (55, 50, 40 для winRate).
  // На каком пороге значение "переключается"? Что возвращается для value === 55?
})

describe("getStatBgColor", () => {
  // TODO: Задание 6.1 — Напишите тесты для getStatBgColor
  // Документация: https://vitest.dev/api/
  //
  // getStatBgColor возвращает CSS-класс фона (bg-green-500, bg-yellow-400 и т.д.)
  // Пороги такие же, как у getStatColor.
  //
  // Подсказка: аналогично getStatColor, но проверяйте "bg-" классы.
  // Пример:
  // test("возвращает bg-green для высокого ADR", () => {
  //   expect(getStatBgColor(90, "adr")).toContain("bg-green")
  // })
})
