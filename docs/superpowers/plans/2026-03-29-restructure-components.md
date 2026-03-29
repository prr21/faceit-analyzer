# Restructure Components — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate student assignment files into `features/` folders grouped by theme, move ready UI components into `components/core/`, so students can easily find their work.

**Architecture:** Files with TODO markers move to `web/src/features/theme-N-*/` with subdirectories (ui/, tabs/, hooks/, charts/). Ready UI components move from `components/ui/` to `components/core/`. Ready tabs, charts, and top-level components stay in `components/`. All imports updated; each task leaves the build passing.

**Tech Stack:** TypeScript, React, Vite (path resolution)

---

## Target Structure

```
web/src/
  features/                                  # ← Студенческие задания
    theme-1-frontend/
      charts/RadarChart.tsx                  [1.1]
      tabs/MatchHistoryTab.tsx               [1.2]
      ui/MatchDetailCard.tsx                 [1.2]
      ui/BestWorstCards.tsx                  [1.3]
    theme-2-multimedia/
      ui/SkeletonCard.tsx                    [2.1]
      ui/AnimatedCounter.tsx                 [2.1]
      ui/MapImage.tsx                        [2.2]
      ui/StatIcon.tsx                        [2.2]
    theme-4-async/
      hooks/usePlayerData.ts                 [4.1]
      hooks/useDebounce.ts                   [4.2]
      ui/PlayerSearch.tsx                    [4.2]
    theme-5-dynamic/
      tabs/CompareTab.tsx                    [5.1]
      ui/CompareView.tsx                     [5.1]
      hooks/usePolling.ts                    [5.2]
      ui/RefreshIndicator.tsx                [5.2]

  components/                                # ← Готовый код (не трогать)
    core/                                    # Базовые UI-компоненты
      Card.tsx
      ErrorMessage.tsx
      FavoriteUnderdogCards.tsx
      LeadershipImpact.tsx
      LoadingSpinner.tsx
      MatchList.tsx
      OpponentTable.tsx
      PlayerHeader.tsx
      RecentPerformance.tsx
      SkillLevelBar.tsx
      SummaryCards.tsx
      WinLossStreak.tsx
      WinRateTable.tsx
    charts/                                  # Готовые графики (без изменений)
    tabs/                                    # Готовые табы
      BanPickTab.tsx                         (без изменений)
      OverviewTab.tsx                        (обновить импорты)
      RadarTab.tsx                           (обновить импорты)
      TrendsTab.tsx                          (без изменений)
      WinrateTab.tsx                         (обновить импорты)
    Layout.tsx                               (обновить импорты)
    ModeToggle.tsx, TabNavigation.tsx, ThemeToggle.tsx  (без изменений)

  hooks/useTheme.ts                          (без изменений)
  __tests__/                                 (без изменений)
```

## Complete Import Change Map

### Files that DON'T need import changes:
- `components/tabs/BanPickTab.tsx` — imports only from `../charts/` (not moving)
- `components/tabs/TrendsTab.tsx` — imports only from `../charts/` (not moving)
- `components/ModeToggle.tsx`, `TabNavigation.tsx`, `ThemeToggle.tsx` — no `ui/` imports
- `echarts-setup.ts` — imports from `echarts/` package, not our components
- `hooks/useTheme.ts` — no component imports
- `__tests__/*` — imports from `../../types`, `../../utils/colors`, `../../hooks/useTheme`, `../App` — none of these move

### core/ internal imports (stay the same — all files flat in same dir):
- `SummaryCards` → `./Card` ✓
- `FavoriteUnderdogCards` → `./Card` ✓
- `WinRateTable` → `./MatchList` ✓
- `RecentPerformance` → `./WinLossStreak` ✓

---

### Task 1: Create directory structure

**Files:**
- Create dirs only

- [ ] **Step 1: Create all directories**

```bash
cd web/src
mkdir -p features/theme-1-frontend/{charts,tabs,ui}
mkdir -p features/theme-2-multimedia/ui
mkdir -p features/theme-4-async/{hooks,ui}
mkdir -p features/theme-5-dynamic/{tabs,hooks,ui}
mkdir -p components/core
```

- [ ] **Step 2: Commit**

```bash
git add web/src/features web/src/components/core
git commit -m "chore: create directory structure for features/ and components/core/"
```

---

### Task 2: Move core UI files (13 files)

**Files:**
- Move: `components/ui/*.tsx` → `components/core/*.tsx` (13 ready files)
- Modify: `components/Layout.tsx` (PlayerHeader import)
- Modify: `components/tabs/OverviewTab.tsx` (4 core imports)
- Modify: `components/tabs/WinrateTab.tsx` (3 core imports)

- [ ] **Step 1: Move 13 files with git mv**

```bash
cd web/src
for f in Card ErrorMessage FavoriteUnderdogCards LeadershipImpact LoadingSpinner MatchList OpponentTable PlayerHeader RecentPerformance SkillLevelBar SummaryCards WinLossStreak WinRateTable; do
  git mv components/ui/$f.tsx components/core/$f.tsx
done
```

- [ ] **Step 2: Update Layout.tsx**

```
OLD: import { PlayerHeader } from "./ui/PlayerHeader"
NEW: import { PlayerHeader } from "./core/PlayerHeader"
```

- [ ] **Step 3: Update OverviewTab.tsx**

```
OLD: import { SummaryCards } from "../ui/SummaryCards"
NEW: import { SummaryCards } from "../core/SummaryCards"

OLD: import { SkillLevelBar } from "../ui/SkillLevelBar"
NEW: import { SkillLevelBar } from "../core/SkillLevelBar"

OLD: import { RecentPerformance } from "../ui/RecentPerformance"
NEW: import { RecentPerformance } from "../core/RecentPerformance"

OLD: import { LeadershipImpact } from "../ui/LeadershipImpact"
NEW: import { LeadershipImpact } from "../core/LeadershipImpact"
```

Note: BestWorstCards import in OverviewTab stays `../ui/BestWorstCards` for now — it will be updated in Task 3.

- [ ] **Step 4: Update WinrateTab.tsx**

```
OLD: import { WinRateTable } from "../ui/WinRateTable"
NEW: import { WinRateTable } from "../core/WinRateTable"

OLD: import { FavoriteUnderdogCards } from "../ui/FavoriteUnderdogCards"
NEW: import { FavoriteUnderdogCards } from "../core/FavoriteUnderdogCards"

OLD: import { OpponentTable } from "../ui/OpponentTable"
NEW: import { OpponentTable } from "../core/OpponentTable"
```

- [ ] **Step 5: Update commented imports in main.tsx**

```
OLD: // import { LoadingSpinner } from "./components/ui/LoadingSpinner"
NEW: // import { LoadingSpinner } from "./components/core/LoadingSpinner"

OLD: // import { ErrorMessage } from "./components/ui/ErrorMessage"
NEW: // import { ErrorMessage } from "./components/core/ErrorMessage"
```

- [ ] **Step 6: Run typecheck**

```bash
cd web && npx tsc --noEmit
```
Expected: PASS (test type errors from vitest deps are expected — ignore those)

- [ ] **Step 7: Commit**

```bash
git add -A web/src/components/ web/src/main.tsx
git commit -m "refactor: move ready UI components to components/core/"
```

---

### Task 3: Move theme-1-frontend files (4 files)

**Files:**
- Move: `components/charts/RadarChart.tsx` → `features/theme-1-frontend/charts/RadarChart.tsx`
- Move: `components/tabs/MatchHistoryTab.tsx` → `features/theme-1-frontend/tabs/MatchHistoryTab.tsx`
- Move: `components/ui/MatchDetailCard.tsx` → `features/theme-1-frontend/ui/MatchDetailCard.tsx`
- Move: `components/ui/BestWorstCards.tsx` → `features/theme-1-frontend/ui/BestWorstCards.tsx`
- Modify: `App.tsx` (MatchHistoryTab import)
- Modify: `components/tabs/OverviewTab.tsx` (BestWorstCards import)
- Modify: `components/tabs/RadarTab.tsx` (RadarChart import)

- [ ] **Step 1: Move 4 files**

```bash
cd web/src
git mv components/charts/RadarChart.tsx features/theme-1-frontend/charts/RadarChart.tsx
git mv components/tabs/MatchHistoryTab.tsx features/theme-1-frontend/tabs/MatchHistoryTab.tsx
git mv components/ui/MatchDetailCard.tsx features/theme-1-frontend/ui/MatchDetailCard.tsx
git mv components/ui/BestWorstCards.tsx features/theme-1-frontend/ui/BestWorstCards.tsx
```

- [ ] **Step 2: Fix internal imports in moved files**

**MatchHistoryTab.tsx** (was `components/tabs/`, now `features/theme-1-frontend/tabs/`):
```
OLD: import type { ... } from "../../types"
NEW: import type { ... } from "../../../types"

OLD: import { getStatColor } from "../../utils/colors"
NEW: import { getStatColor } from "../../../utils/colors"

OLD: import { MatchDetailCard } from "../ui/MatchDetailCard"
NEW: import { MatchDetailCard } from "../ui/MatchDetailCard"   ← NO CHANGE (same relative path within theme)
```

**BestWorstCards.tsx** (was `components/ui/`, now `features/theme-1-frontend/ui/`):
```
OLD: import { Card } from "./Card"
NEW: import { Card } from "../../../components/core/Card"
```
Also read the file — if it imports from `../../types`, update to `../../../types`.

**RadarChart.tsx** (was `components/charts/`, now `features/theme-1-frontend/charts/`):
Read the file — update any `../../types` to `../../../types`.

**MatchDetailCard.tsx** (was `components/ui/`, now `features/theme-1-frontend/ui/`):
Read the file — update any `../../types` to `../../../types`.

- [ ] **Step 3: Fix external importers**

**App.tsx:**
```
OLD: import { MatchHistoryTab } from "./components/tabs/MatchHistoryTab"
NEW: import { MatchHistoryTab } from "./features/theme-1-frontend/tabs/MatchHistoryTab"
```

**OverviewTab.tsx:**
```
OLD: import { BestWorstCards } from "../ui/BestWorstCards"
NEW: import { BestWorstCards } from "../../features/theme-1-frontend/ui/BestWorstCards"
```

**RadarTab.tsx:**
```
OLD: import { RadarChart } from "../charts/RadarChart"
NEW: import { RadarChart } from "../../features/theme-1-frontend/charts/RadarChart"
```

- [ ] **Step 4: Run typecheck, commit**

```bash
cd web && npx tsc --noEmit
git add -A && git commit -m "refactor: move theme 1 (frontend) files to features/theme-1-frontend/"
```

---

### Task 4: Move theme-2-multimedia files (4 files)

**Files:**
- Move: `components/ui/SkeletonCard.tsx` → `features/theme-2-multimedia/ui/SkeletonCard.tsx`
- Move: `components/ui/AnimatedCounter.tsx` → `features/theme-2-multimedia/ui/AnimatedCounter.tsx`
- Move: `components/ui/MapImage.tsx` → `features/theme-2-multimedia/ui/MapImage.tsx`
- Move: `components/ui/StatIcon.tsx` → `features/theme-2-multimedia/ui/StatIcon.tsx`

- [ ] **Step 1: Move 4 files**

```bash
cd web/src
git mv components/ui/SkeletonCard.tsx features/theme-2-multimedia/ui/SkeletonCard.tsx
git mv components/ui/AnimatedCounter.tsx features/theme-2-multimedia/ui/AnimatedCounter.tsx
git mv components/ui/MapImage.tsx features/theme-2-multimedia/ui/MapImage.tsx
git mv components/ui/StatIcon.tsx features/theme-2-multimedia/ui/StatIcon.tsx
```

- [ ] **Step 2: Fix internal imports in moved files**

All 4 were in `components/ui/`. Now in `features/theme-2-multimedia/ui/`.
Read each file — update any `../../types` to `../../../types`, any `../../utils/*` to `../../../utils/*`.

These 4 files have NO active importers (all unused until students wire them in). No external import fixes needed.

- [ ] **Step 3: Run typecheck, commit**

```bash
cd web && npx tsc --noEmit
git add -A && git commit -m "refactor: move theme 2 (multimedia) files to features/theme-2-multimedia/"
```

---

### Task 5: Move theme-4-async files (3 files)

**Files:**
- Move: `hooks/usePlayerData.ts` → `features/theme-4-async/hooks/usePlayerData.ts`
- Move: `hooks/useDebounce.ts` → `features/theme-4-async/hooks/useDebounce.ts`
- Move: `components/ui/PlayerSearch.tsx` → `features/theme-4-async/ui/PlayerSearch.tsx`
- Modify: `components/Layout.tsx` (commented PlayerSearch import)
- Modify: `main.tsx` (commented usePlayerData import)

- [ ] **Step 1: Move 3 files**

```bash
cd web/src
git mv hooks/usePlayerData.ts features/theme-4-async/hooks/usePlayerData.ts
git mv hooks/useDebounce.ts features/theme-4-async/hooks/useDebounce.ts
git mv components/ui/PlayerSearch.tsx features/theme-4-async/ui/PlayerSearch.tsx
```

- [ ] **Step 2: Fix internal imports in moved files**

**PlayerSearch.tsx** (was `components/ui/`, now `features/theme-4-async/ui/`):
```
OLD (commented): // import { useDebounce } from "../../hooks/useDebounce"
NEW (commented): // import { useDebounce } from "../hooks/useDebounce"
```
Also update any `../../types` to `../../../types`.

**usePlayerData.ts** (was `hooks/`, now `features/theme-4-async/hooks/`):
Read the file — update any `../types` to `../../../types`.

**useDebounce.ts** (was `hooks/`, now `features/theme-4-async/hooks/`):
Read the file — no external imports expected (pure hook).

- [ ] **Step 3: Fix external importers (commented lines)**

**Layout.tsx:**
```
OLD: // import { PlayerSearch } from "./ui/PlayerSearch"
NEW: // import { PlayerSearch } from "../features/theme-4-async/ui/PlayerSearch"
```

**main.tsx:**
```
OLD: // import { usePlayerData } from "./hooks/usePlayerData"
NEW: // import { usePlayerData } from "./features/theme-4-async/hooks/usePlayerData"
```

- [ ] **Step 4: Run typecheck, commit**

```bash
cd web && npx tsc --noEmit
git add -A && git commit -m "refactor: move theme 4 (async API) files to features/theme-4-async/"
```

---

### Task 6: Move theme-5-dynamic files (4 files)

**Files:**
- Move: `components/tabs/CompareTab.tsx` → `features/theme-5-dynamic/tabs/CompareTab.tsx`
- Move: `components/ui/CompareView.tsx` → `features/theme-5-dynamic/ui/CompareView.tsx`
- Move: `hooks/usePolling.ts` → `features/theme-5-dynamic/hooks/usePolling.ts`
- Move: `components/ui/RefreshIndicator.tsx` → `features/theme-5-dynamic/ui/RefreshIndicator.tsx`
- Modify: `App.tsx` (CompareTab import)
- Modify: `components/Layout.tsx` (commented RefreshIndicator import)

- [ ] **Step 1: Move 4 files**

```bash
cd web/src
git mv components/tabs/CompareTab.tsx features/theme-5-dynamic/tabs/CompareTab.tsx
git mv components/ui/CompareView.tsx features/theme-5-dynamic/ui/CompareView.tsx
git mv hooks/usePolling.ts features/theme-5-dynamic/hooks/usePolling.ts
git mv components/ui/RefreshIndicator.tsx features/theme-5-dynamic/ui/RefreshIndicator.tsx
```

- [ ] **Step 2: Fix internal imports in moved files**

**CompareTab.tsx** (was `components/tabs/`, now `features/theme-5-dynamic/tabs/`):
```
OLD: import type { ReportData } from "../../types"
NEW: import type { ReportData } from "../../../types"

OLD: import { CompareView } from "../ui/CompareView"
NEW: import { CompareView } from "../ui/CompareView"   ← NO CHANGE (same theme)

OLD: import { LoadingSpinner } from "../ui/LoadingSpinner"
NEW: import { LoadingSpinner } from "../../../components/core/LoadingSpinner"

OLD: import { ErrorMessage } from "../ui/ErrorMessage"
NEW: import { ErrorMessage } from "../../../components/core/ErrorMessage"
```

**CompareView.tsx** (was `components/ui/`, now `features/theme-5-dynamic/ui/`):
Read — update `../../types` to `../../../types`.

**RefreshIndicator.tsx** (was `components/ui/`, now `features/theme-5-dynamic/ui/`):
Read — update `../../types` to `../../../types` if present.

**usePolling.ts** (was `hooks/`, now `features/theme-5-dynamic/hooks/`):
Read — update `../types` to `../../../types` if present.

- [ ] **Step 3: Fix external importers**

**App.tsx:**
```
OLD: import { CompareTab } from "./components/tabs/CompareTab"
NEW: import { CompareTab } from "./features/theme-5-dynamic/tabs/CompareTab"
```

**Layout.tsx:**
```
OLD: // import { RefreshIndicator } from "./ui/RefreshIndicator"
NEW: // import { RefreshIndicator } from "../features/theme-5-dynamic/ui/RefreshIndicator"
```

- [ ] **Step 4: Run typecheck, commit**

```bash
cd web && npx tsc --noEmit
git add -A && git commit -m "refactor: move theme 5 (dynamic) files to features/theme-5-dynamic/"
```

---

### Task 7: Clean up empty directories and remove old components/ui/

- [ ] **Step 1: Verify components/ui/ is empty**

```bash
ls web/src/components/ui/
```
Expected: directory should be empty (all files moved to core/ or features/).

- [ ] **Step 2: Remove empty directory**

```bash
rmdir web/src/components/ui
```

- [ ] **Step 3: Verify hooks/ only has useTheme.ts**

```bash
ls web/src/hooks/
```
Expected: only `useTheme.ts` remains.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove empty components/ui/ directory"
```

---

### Task 8: Update documentation

**Files:**
- Modify: `README.md` (project structure tree)
- Modify: `docs/themes/theme-1-frontend.md` through `theme-7-integration-tests.md` (file paths)
- Modify: `EDUCATION_TASKS.md` (no file paths — no change needed)
- Modify: `server/README.md` (no web paths — no change needed)

- [ ] **Step 1: Update README.md structure tree**

Replace the "Структура проекта" section with the new tree reflecting `features/` and `components/core/`.

- [ ] **Step 2: Update theme docs file paths**

In each `docs/themes/theme-N-*.md`, update the "Файлы:" sections to use new paths:
- theme-1: `features/theme-1-frontend/charts/RadarChart.tsx`, etc.
- theme-2: `features/theme-2-multimedia/ui/SkeletonCard.tsx`, etc.
- theme-4: `features/theme-4-async/hooks/usePlayerData.ts`, etc.
- theme-5: `features/theme-5-dynamic/tabs/CompareTab.tsx`, etc.
- theme-6: paths unchanged (__tests__/ didn't move)
- theme-7: paths unchanged

- [ ] **Step 3: Commit**

```bash
git add README.md docs/themes/
git commit -m "docs: update file paths after restructuring"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full typecheck**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 2: Verify no stale imports reference old paths**

```bash
cd web/src
grep -rn '"\.\.\/ui\/' components/ --include="*.tsx" --include="*.ts"
grep -rn '"\.\/ui\/' components/ --include="*.tsx" --include="*.ts"
grep -rn '"\.\.\/\.\.\/hooks\/' components/ --include="*.tsx" --include="*.ts"
```
Expected: no results (all old `ui/` and `hooks/` paths updated).

- [ ] **Step 3: Verify TODO markers preserved**

```bash
grep -rn "TODO: Задание" web/src/features/ --include="*.tsx" --include="*.ts" | wc -l
```
Expected: same count as before (~49).

- [ ] **Step 4: Verify no TODO files remain outside features/**

```bash
grep -rl "TODO: Задание" web/src/components/ web/src/hooks/ --include="*.tsx" --include="*.ts"
```
Expected: only `components/Layout.tsx` (has commented TODO slots for PlayerSearch/RefreshIndicator).
