# @faceit/web

React SPA — дашборд анализа FACEIT CS2: поиск игроков и команд, отчёты по бан/пикам, винрейту, трендам ELO.

## Запуск

```bash
npm install                # из корня monorepo
npm run dev:server         # Express-сервер (нужен FACEIT_API_KEY в корневом .env)
npm run dev:web            # Vite dev server → http://localhost:5173
npm run build:web          # production-сборка (dist/ используется CLI-отчётами)
npm test --workspace=web   # тесты (vitest)
```

## Стек

Vite · React · TypeScript · Tailwind CSS v4 (`@import "tailwindcss"`, без config-файла) · ECharts (`echarts/core`, tree-shaking) · TanStack Query · react-router-dom (HashRouter).

## Структура

Feature-based: `app → pages → features → shared`.

```
src/
  main.tsx            # entry: echarts-setup, css, window.__REPORT_DATA__
  app/                # инициализация: App, StoreProvider, query-client, роуты
    routing/routes.tsx
  pages/              # route-компоненты: Search, Player, TeamRoster, Team, Report
  features/
    search/           # GlobalSearch (игроки + команды, UUID/URL напрямую)
    team/             # хуки ростера и анализа команды
    compare/          # сравнение игроков (CompareTab)
    report/           # отчёт: ReportView, Layout, tabs/, charts/, ui/, model/
  shared/
    ui/               # Card, LoadingSpinner, ErrorMessage, ThemeToggle
    api/              # client.ts (apiFetch), endpoints.ts (запросы к серверу)
    routing/paths.ts  # PATHS + билдеры путей
    hooks/useTheme.ts
    lib/              # colors.ts, echarts-setup.ts
    types/            # re-export типов из @faceit/core + ReportData
    fixtures/         # mockData (тесты + DEV-фоллбек /report)
  __tests__/          # vitest: unit + integration, setup.ts
```

**Правила импортов:**

- Слои сверху вниз: `app → pages → features → shared`; `shared` не импортирует ничего выше себя.
- Фичи не импортируют друг друга; исключение — `features/report` и `pages` собирают другие фичи (CompareTab, GlobalSearch).
- Между папками — только алиас `@/` (`@/shared/ui/Card`), относительные пути — внутри одной папки/фичи.
- Баррелей нет — импорт прямо из файла.

## Правила UI

- **Dark mode обязателен** — каждый новый элемент с `dark:`-классами Tailwind.
- **Mobile responsive обязателен** — проверять на узком экране.
- Проверка перед коммитом: `npm run typecheck`, `npm test --workspace=web -- --run`, визуально в браузере (обе темы).

## Данные

Web не ходит в FACEIT напрямую: `fetch(/api/...)` → vite proxy → `@faceit/server` (скрывает API-ключ). При открытии CLI-отчёта данные встроены в HTML через `window.__REPORT_DATA__`.
