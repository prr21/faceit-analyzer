import { describe, test, expect } from "vitest"
import { getStatColor, getStatBgColor } from "@/shared/lib/colors"
import type { StatType } from "@/shared/lib/colors"

describe("getStatColor", () => {
  // Все пороги всех типов статистики, включая граничные значения
  test.each([
    // winRate: >= 55 зелёный, >= 50 серый, >= 40 оранжевый, < 40 красный
    [60, "winRate", "green"],
    [55, "winRate", "green"],
    [52, "winRate", "gray"],
    [50, "winRate", "gray"],
    [45, "winRate", "orange"],
    [40, "winRate", "orange"],
    [30, "winRate", "red"],
    // kd: >= 1.1, >= 1.0, >= 0.8, < 0.8
    [1.5, "kd", "green"],
    [1.1, "kd", "green"],
    [1.05, "kd", "gray"],
    [1.0, "kd", "gray"],
    [0.9, "kd", "orange"],
    [0.8, "kd", "orange"],
    [0.5, "kd", "red"],
    // adr: >= 85, >= 75, >= 60, < 60
    [90, "adr", "green"],
    [85, "adr", "green"],
    [80, "adr", "gray"],
    [75, "adr", "gray"],
    [70, "adr", "orange"],
    [60, "adr", "orange"],
    [50, "adr", "red"],
    // hs: >= 55, >= 45, >= 35, < 35
    [60, "hs", "green"],
    [55, "hs", "green"],
    [50, "hs", "gray"],
    [45, "hs", "gray"],
    [40, "hs", "orange"],
    [35, "hs", "orange"],
    [20, "hs", "red"],
  ] as [number, StatType, string][])(
    "getStatColor(%f, %s) содержит %s",
    (value, type, expected) => {
      expect(getStatColor(value, type)).toContain(expected)
    },
  )
})

describe("getStatBgColor", () => {
  // Фоновые классы: зелёный/жёлтый/оранжевый/красный по тем же порогам
  test.each([
    [60, "winRate", "bg-green"],
    [52, "winRate", "bg-yellow"],
    [45, "winRate", "bg-orange"],
    [30, "winRate", "bg-red"],
    [1.2, "kd", "bg-green"],
    [1.0, "kd", "bg-yellow"],
    [0.9, "kd", "bg-orange"],
    [0.5, "kd", "bg-red"],
    [90, "adr", "bg-green"],
    [80, "adr", "bg-yellow"],
    [65, "adr", "bg-orange"],
    [40, "adr", "bg-red"],
    [58, "hs", "bg-green"],
    [50, "hs", "bg-yellow"],
    [40, "hs", "bg-orange"],
    [10, "hs", "bg-red"],
  ] as [number, StatType, string][])(
    "getStatBgColor(%f, %s) содержит %s",
    (value, type, expected) => {
      expect(getStatBgColor(value, type)).toContain(expected)
    },
  )
})
