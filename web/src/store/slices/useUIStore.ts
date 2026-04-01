import { create } from "zustand"

interface UIState {
  // Сравнение игроков (CompareTab)
  compareNicknames: [string, string]
  setCompareNickname: (index: 0 | 1, value: string) => void
  clearCompare: () => void
}

export const useUIStore = create<UIState>(set => ({
  compareNicknames: ["", ""],

  setCompareNickname: (index, value) =>
    set(state => {
      const next: [string, string] = [...state.compareNicknames]
      next[index] = value
      return { compareNicknames: next }
    }),

  clearCompare: () => set({ compareNicknames: ["", ""] }),
}))
