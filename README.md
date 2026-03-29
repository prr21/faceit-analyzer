# FACEIT CS2 Dashboard — Учебный проект

Аналитический дашборд для визуализации статистики игроков CS2 с платформы FACEIT: графики, таблицы, карточки с метриками, история матчей, сравнение игроков. Приложение поддерживает тёмную и светлую тему, адаптировано под мобильные устройства.

В коде расставлены `// TODO:` маркеры с подробными подсказками — нужно дописать логику в подготовленных местах. Подробные описания заданий — в [EDUCATION_TASKS.md](EDUCATION_TASKS.md).

## Стек технологий

| Технология | Версия | Назначение |
|-----------|--------|-----------|
| React | 19 | UI-фреймворк (компоненты, хуки, состояние) |
| TypeScript | 5.9 | Статическая типизация |
| Vite | 6 | Сборка и dev-сервер с hot reload |
| Tailwind CSS | 4 | Утилитарные CSS-классы (`@import "tailwindcss"`, НЕ v3) |
| ECharts | 5 | Интерактивные графики и диаграммы |
| Vitest | 3 | Unit и интеграционные тесты |
| Express.js | 5 | REST API proxy-сервер |

## Предварительные требования

- **Node.js** >= 18 и **npm** — [nodejs.org](https://nodejs.org/)
- **Git** — [git-scm.com](https://git-scm.com/)
- **VS Code** с расширением **[Todo Tree](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree)** (Gruntfuggly) — выделяет TODO/BONUS в коде, создаёт панель навигации по всем заданиям
- **FACEIT API ключ** — нужен для тем 3-5. Получить: [developers.faceit.com](https://developers.faceit.com/)

## Быстрый старт

```bash
# 1. Установка зависимостей
cd web && npm install
cd ../server && npm install
cd ..

# 2. Настройка API-ключа (нужен для тем 3-5)
cp .env.example .env
# Откройте .env и вставьте ваш FACEIT_API_KEY

# 3. Запуск фронтенда
cd web && npm run dev
# Откройте http://localhost:5173 — приложение работает с предзагруженными данными
```

### Дополнительные команды

```bash
# Запуск сервера (для тем 3, 4, 5)
cd server && npm run dev          # http://localhost:3000

# Тесты (для тем 6, 7)
cd web && npm test                # watch mode
cd web && npm run test:coverage   # отчёт покрытия

# Проверка типов
cd web && npm run typecheck
```

## Как работать с заданиями

1. Установите расширение **Todo Tree** в VS Code — оно покажет все TODO и BONUS маркеры в панели слева
2. Ищите `// TODO: Задание X.Y` в коде — каждый содержит задачу, подсказки и ссылку на документацию
3. `// BONUS:` — дополнительные задания для продвинутых (3 штуки)
4. Подробные описания каждого задания — в [EDUCATION_TASKS.md](EDUCATION_TASKS.md)
5. **Правило:** все новые элементы должны поддерживать тёмную тему (`dark:` классы Tailwind) и мобильную вёрстку

## Содержание

| # | Тема | Задания | TODO | Файлы |
|---|------|---------|------|-------|
| 1 | [Frontend-компоненты](docs/themes/theme-1-frontend.md) | 1.1, 1.2, 1.3 | 8 + 2 BONUS | RadarChart, MatchHistoryTab, BestWorstCards |
| 2 | [Мультимедиа и анимации](docs/themes/theme-2-multimedia.md) | 2.1, 2.2 | 7 + 1 BONUS | SkeletonCard, AnimatedCounter, MapImage, StatIcon, app.css |
| 3 | [REST API сервер](docs/themes/theme-3-rest-api.md) | 3.1 | 7 | server/src/* |
| 4 | [Асинхронное API](docs/themes/theme-4-async-api.md) | 4.1, 4.2 | 5 | usePlayerData, useDebounce, PlayerSearch |
| 5 | [Динамическое обновление](docs/themes/theme-5-dynamic.md) | 5.1, 5.2 | 6 | CompareTab, CompareView, usePolling, RefreshIndicator |
| 6 | [Unit-тестирование](docs/themes/theme-6-unit-tests.md) | 6.1 | 3 | colors.test.ts, useTheme.test.ts |
| 7 | [Интеграционное тестирование](docs/themes/theme-7-integration-tests.md) | 7.1 | 14 | App.integration.test.tsx |

## Порядок выполнения

```
Трек A — Фронтенд (работает сразу, без сервера)
  Тема 1 (компоненты) ─┐
  Тема 2 (анимации)  ──┤── независимые, в любом порядке
                        │
Трек B — Полный стек    │
  Тема 3 (сервер)  ─────┤
       │                │
       ├── Тема 4 (fetch, поиск)
       │        │
       │        └── Тема 5.2 (автообновление)
       │
       └── Тема 5.1 (сравнение)

Тестирование (параллельно с любым треком)
  Тема 6 (unit-тесты)
  Тема 7 (интеграционные тесты)
```

**Трек A** не требует сервера — компоненты работают с предзагруженными данными.
**Трек B** начинается с Темы 3 (сервер), затем Темы 4-5 используют его API.
**Тестирование** можно выполнять параллельно с любой темой.

## Структура проекта

```
web/                                    # React-фронтенд
  src/
    App.tsx                             # Главный компонент (табы, навигация)
    main.tsx                            # Точка входа                    [4.1]
    types.ts                            # TypeScript-интерфейсы
    app.css                             # Стили + анимации               [2.1]
    components/
      charts/RadarChart.tsx             # Радарная диаграмма             [1.1]
      tabs/
        RadarTab.tsx                    # Таб "Радар"                    [1.1]
        MatchHistoryTab.tsx             # Таб "Матчи" (раскрытие строк) [1.2]
        OverviewTab.tsx                 # Таб "Обзор"                   [1.3]
        CompareTab.tsx                  # Таб "Сравнение"               [5.1]
      ui/
        MatchDetailCard.tsx             # Детали матча                   [1.2]
        BestWorstCards.tsx              # Лучшие/худшие карты            [1.3]
        PlayerSearch.tsx                # Поиск игроков                  [4.2]
        CompareView.tsx                 # Сравнение двух игроков         [5.1]
        RefreshIndicator.tsx            # Индикатор обновления           [5.2]
        SkeletonCard.tsx                # Скелетон-заглушка              [2.1]
        AnimatedCounter.tsx             # Анимированный счётчик          [2.1]
        MapImage.tsx                    # Изображение карты              [2.2]
        StatIcon.tsx                    # SVG-иконки                     [2.2]
        LoadingSpinner.tsx              # Спиннер загрузки (готов)
        ErrorMessage.tsx                # Сообщение об ошибке (готов)
    hooks/
      usePlayerData.ts                  # Загрузка данных                [4.1]
      useDebounce.ts                    # Debounce хук                   [4.2]
      usePolling.ts                     # Polling хук                    [5.2]
      useTheme.ts                       # Тема (готов)
    utils/colors.ts                     # Цветовая система (готов)
    __tests__/
      colors.test.ts                    # Unit-тесты цветов              [6.1]
      useTheme.test.ts                  # Unit-тесты темы                [6.1]
      App.integration.test.tsx          # Интеграционные тесты           [7.1]
      fixtures/mockData.ts              # Тестовые данные (готов)
      setup.ts                          # Настройка тестов (готов)
  public/maps/                          # Изображения карт               [2.2]

server/                                 # Express API-сервер
  src/
    index.ts                            # Точка входа                    [3.1]
    routes/api.ts                       # API-маршруты                   [3.1]
    middleware/cors.ts                   # CORS middleware                [3.1]
    middleware/rateLimit.ts             # Rate limiting                   [3.1]
  README.md                             # Инструкции к серверу
```

## Полезные команды

| Команда | Директория | Описание |
|---------|-----------|----------|
| `npm run dev` | `web/` | Запуск Vite dev-сервера (localhost:5173) |
| `npm run build` | `web/` | Сборка для продакшена |
| `npm run typecheck` | `web/` | Проверка TypeScript-типов |
| `npm test` | `web/` | Запуск тестов (watch mode) |
| `npm run test:coverage` | `web/` | Отчёт покрытия кода |
| `npm run dev` | `server/` | Запуск Express-сервера (localhost:3000) |
| `npm run typecheck` | `server/` | Проверка типов сервера |

## FAQ

**Нет данных на localhost:5173**
Приложение работает с предзагруженными данными из HTML. В режиме `npm run dev` данные встроены в шаблон `index.html`. Для динамической загрузки выполните Тему 4.1 и запустите сервер.

**CORS-ошибка в консоли браузера**
Нужно реализовать CORS middleware в Теме 3.1 (`server/src/middleware/cors.ts`).

**Тесты не запускаются**
Убедитесь, что выполнили `npm install` в `web/`. Зависимости тестов (vitest, testing-library) устанавливаются вместе с остальными.

**Tailwind-классы не работают**
Проект использует Tailwind CSS **v4** — конфигурация через `@import "tailwindcss"` в CSS, без `tailwind.config.js`.

**Как найти все TODO**
Установите расширение **Todo Tree** в VS Code — оно покажет дерево всех TODO и BONUS маркеров с навигацией.
