# FACEIT CS2 Dashboard

Аналитический дашборд для визуализации статистики игроков и команд CS2 с платформы FACEIT: баны/пики карт, винрейт, тренды, история матчей, сравнение игроков, обнаружение смурфов. Поддержка тёмной/светлой темы и мобильной вёрстки.

## Структура проекта

TypeScript monorepo на npm workspaces:

```
faceit/
├── core/       # @faceit/core — бизнес-логика, API-клиенты, типы
├── cli/        # @faceit/cli — CLI-скрипты для оффлайн-анализа
├── server/     # @faceit/server — Express proxy с layered architecture
├── web/        # @faceit/web — React SPA (Vite + Tailwind + ECharts)
└── browser/    # DevTools-скрипты (не workspace)
```

Детали архитектуры — в [CLAUDE.md](CLAUDE.md).

## Стек технологий

| Технология | Назначение |
|-----------|-----------|
| TypeScript 5.9 | Единая типизация во всех workspace-ах |
| React 19 | UI-фреймворк (web/) |
| Vite 6 | Сборка и dev-сервер |
| Tailwind CSS 4 | Утилитарные CSS-классы |
| ECharts 5 | Интерактивные графики |
| Express.js 5 | REST API proxy-сервер |
| Axios | HTTP-клиент для FACEIT API |

## Предварительные требования

- **Node.js** >= 18 и **npm**
- **FACEIT API ключ** — получить на [developers.faceit.com](https://developers.faceit.com/)

## Установка

```bash
npm install                      # поставит зависимости для всех workspace-ов
cp .env.example .env             # затем вписать FACEIT_API_KEY
```

## Запуск

### CLI-анализ

```bash
npm run team -- "Satanics Aura"  # анализ стратегии команды
npm run player -- "dErzz"        # анализ игрока
npm run smurfs -- "ed1v9k"       # обнаружение смурфов в матчах
```

Отчёты сохраняются в `output/reports/*.html` — standalone HTML с графиками.

### Web-приложение

```bash
npm run dev:server               # Express API → http://localhost:3000
npm run dev:web                  # Vite dev-сервер → http://localhost:5173
npm run build:web                # продакшн-сборка
```

### Проверка типов

```bash
npm run typecheck                # все workspace-ы
npm run typecheck:core           # только core/
npm run typecheck:web            # только web/
```

## FACEIT API

Проект использует два API:
- **Open Data API** (`open.faceit.com/data/v4`) — требует Bearer-токен, лимит 10k req/h
- **Democracy API** (`www.faceit.com/api/democracy/v1`) — без авторизации, для истории голосований по картам

Полный справочник эндпоинтов — в [CLAUDE.md](CLAUDE.md#faceit-api-reference).

## Образовательная ветка

Ветка `education` содержит тот же код с TODO-заглушками и пошаговыми инструкциями в `docs/themes/` — используется как учебный материал (46 заданий по React, Express, тестированию). Тег `education-v1` фиксирует первую выпускную версию.

```bash
git checkout education           # переключиться на обучающую версию
git checkout master              # вернуться к продакшну
```
