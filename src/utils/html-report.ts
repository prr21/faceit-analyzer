import type { TeamDropPickStats, PlayerDropPickStats } from "../types/faceit.js"
import {
  buildBanPickChart,
  buildWinRateChart,
  buildDeciderWinRateChart,
  buildTrendChart,
  buildWinRateTrendChart,
  buildMatchCountChart,
  buildEloChart,
  buildCompetitionChart,
  buildCompetitionPieChart,
  buildWinRateTable,
  buildFavoriteUnderdogCards,
  buildSummaryCards,
} from "./charts.js"

const REPORT_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 960px; margin: 0 auto; padding: 20px; background: #fafafa; color: #333; }
  h1 { margin-bottom: 4px; }
  h2 { margin-top: 30px; }
  .meta { color: #555; margin: 4px 0; }
  canvas { margin-bottom: 30px; }

  .tabs { display: flex; gap: 0; border-bottom: 2px solid #ddd; margin: 20px 0 0; }
  .tab { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 500; color: #777; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
  .tab:hover { color: #333; }
  .tab.active { color: #333; border-bottom-color: #4a90d9; }
  .tab-content { display: none; padding: 20px 0; }
  .tab-content.active { display: block; }

  .cards-row { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
  .card { flex: 1; min-width: 140px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; text-align: center; }
  .card-title { font-size: 12px; color: #777; text-transform: uppercase; margin-bottom: 8px; }
  .card-value { font-size: 28px; font-weight: 700; }
  .card-value.green { color: #2d9e2d; }
  .card-value.red { color: #d93636; }
  .card-sub { font-size: 12px; color: #999; margin-top: 4px; }

  .section-title { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 16px; }
  .wr-table { border-collapse: collapse; margin: 12px 0 30px; width: 100%; }
  .wr-table th, .wr-table td { border: 1px solid #ddd; padding: 6px 14px; text-align: center; }
  .wr-table th { background: #f5f5f5; }

  .trend-select { margin: 10px 0 20px; }
  .trend-select select { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
  .trend-canvas { display: none; }
  .trend-canvas.active { display: block; }
`

const TAB_SCRIPT = `
  document.querySelectorAll('.tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    };
  });

  // Переключение трендов банов по фазам
  const trendSelect = document.getElementById('trendPhaseSelect');
  if (trendSelect) {
    trendSelect.onchange = () => {
      document.querySelectorAll('.trend-canvas').forEach(el => el.classList.remove('active'));
      const target = document.getElementById('trend-' + trendSelect.value);
      if (target) target.classList.add('active');
    };
  }
`

function buildHeader(title: string, meta: string, earliest: string, latest: string, allCount: number): string {
  return `
  <h1>${title}</h1>
  <p class="meta">${meta}</p>
  <p class="meta">Период: ${earliest} — ${latest} | Всего матчей: ${allCount}</p>`
}

function buildTabs(tabs: string[]): string {
  return `
  <div class="tabs">
    ${tabs.map((name, i) => `<button class="tab ${i === 0 ? "active" : ""}" data-tab="${name.toLowerCase().replace(/[/\s]/g, "")}">${name}</button>`).join("\n    ")}
  </div>`
}

export function generatePlayerHtmlReport(nickname: string, stats: PlayerDropPickStats): string {
  const hasWinRate = Object.keys(stats.mapWinRate).length > 0
  const hasTrends = stats.trends.length >= 2
  const hasElo = stats.eloHistory.length >= 2
  const hasDeciderWr = Object.keys(stats.deciderWinRate).length > 0
  const hasFU = stats.favoriteUnderdog.asFavorite.total > 0 || stats.favoriteUnderdog.asUnderdog.total > 0
  const hasComp = Object.keys(stats.competitionStats).length > 0

  // Собираем все chart scripts
  const scripts: string[] = []

  // Таб: Баны/Пики
  scripts.push(buildBanPickChart("playerChart", `Баны и пики — ${nickname}`, stats.stats, stats.decider))
  if (hasDeciderWr) scripts.push(buildDeciderWinRateChart("deciderWrChart", stats.deciderWinRate))

  // Таб: Винрейт
  if (hasWinRate) scripts.push(buildWinRateChart("winRateChart", stats.mapWinRate))
  if (hasComp) scripts.push(buildCompetitionChart("compChart", stats.competitionStats))

  // Таб: Тренды
  if (hasTrends) {
    scripts.push(buildTrendChart("trendFirstBan", "Тренды первых банов", stats.trends, "firstBan"))
    scripts.push(buildTrendChart("trendSecondBan", "Тренды вторых банов", stats.trends, "secondBan"))
    scripts.push(buildTrendChart("trendThirdBan", "Тренды последних банов", stats.trends, "thirdBan"))
    scripts.push(buildTrendChart("trendFirstPick", "Тренды пиков (BO3)", stats.trends, "firstPick"))
    scripts.push(buildWinRateTrendChart("wrTrendChart", stats.trends))
    scripts.push(buildMatchCountChart("matchCountChart", stats.trends))
  }
  if (hasElo) scripts.push(buildEloChart("eloChart", stats.eloHistory))

  // Таб: Обзор
  if (hasComp) scripts.push(buildCompetitionPieChart("compPieChart", stats.competitionStats))

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Статистика — ${nickname}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>${REPORT_STYLES}</style>
</head>
<body>
  ${buildHeader(`Статистика — ${nickname}`, stats.mapInfo, stats.earliestGame, stats.latestGame, stats.allCount)}
  ${buildTabs(["Баны/Пики", "Винрейт", "Тренды", "Обзор"])}

  <div class="tab-content active" id="tab-баны/пики">
    <canvas id="playerChart" width="800" height="400"></canvas>
    ${hasDeciderWr ? `<h2>Десайдер — винрейт</h2><canvas id="deciderWrChart" width="800" height="300"></canvas>` : ""}
  </div>

  <div class="tab-content" id="tab-винрейт">
    ${hasWinRate ? `${buildWinRateTable(stats.mapWinRate)}<canvas id="winRateChart" width="800" height="400"></canvas>` : "<p>Нет данных о винрейте</p>"}
    ${hasFU ? `<h2 class="section-title">Фаворит vs Андердог</h2>${buildFavoriteUnderdogCards(stats.favoriteUnderdog)}` : ""}
    ${hasComp ? `<h2 class="section-title">По типу соревнования</h2><canvas id="compChart" width="800" height="250"></canvas>` : ""}
  </div>

  <div class="tab-content" id="tab-тренды">
    ${hasTrends ? `
    <h2>Тренды банов/пиков</h2>
    <div class="trend-select">
      <select id="trendPhaseSelect">
        <option value="firstBan">Первый бан</option>
        <option value="secondBan">Второй бан</option>
        <option value="thirdBan">Последний бан</option>
        <option value="firstPick">Пик (BO3)</option>
      </select>
    </div>
    <div id="trend-firstBan" class="trend-canvas active"><canvas id="trendFirstBan" width="800" height="350"></canvas></div>
    <div id="trend-secondBan" class="trend-canvas"><canvas id="trendSecondBan" width="800" height="350"></canvas></div>
    <div id="trend-thirdBan" class="trend-canvas"><canvas id="trendThirdBan" width="800" height="350"></canvas></div>
    <div id="trend-firstPick" class="trend-canvas"><canvas id="trendFirstPick" width="800" height="350"></canvas></div>

    <h2 class="section-title">Тренды винрейта</h2>
    <canvas id="wrTrendChart" width="800" height="350"></canvas>

    <h2 class="section-title">Количество матчей</h2>
    <canvas id="matchCountChart" width="800" height="250"></canvas>
    ` : "<p>Недостаточно данных для трендов (нужно минимум 2 месяца)</p>"}

    ${hasElo ? `<h2 class="section-title">Динамика ELO</h2><canvas id="eloChart" width="800" height="350"></canvas>` : ""}
  </div>

  <div class="tab-content" id="tab-обзор">
    ${buildSummaryCards(stats.allCount, stats.count, stats.avgElo, stats.mapWinRate, stats.earliestGame, stats.latestGame)}
    ${hasComp ? `<h2>Распределение по типу</h2><canvas id="compPieChart" width="400" height="400" style="max-width:400px;margin:0 auto;display:block;"></canvas>` : ""}
  </div>

  <script>
${scripts.filter(Boolean).join("\n")}
${TAB_SCRIPT}
  </script>
</body>
</html>`
}

export function generateHtmlReport(teamName: string, stats: TeamDropPickStats): string {
  const hasWinRate = Object.keys(stats.mapWinRate).length > 0
  const hasTrends = stats.trends.length >= 2
  const hasElo = stats.eloHistory.length >= 2
  const hasDeciderWr = Object.keys(stats.deciderWinRate).length > 0
  const hasFU = stats.favoriteUnderdog.asFavorite.total > 0 || stats.favoriteUnderdog.asUnderdog.total > 0
  const hasComp = Object.keys(stats.competitionStats).length > 0

  const scripts: string[] = []

  // Таб: Баны/Пики
  scripts.push(buildBanPickChart("targetChart", `Баны и пики — ${teamName}`, stats.target, stats.decider))
  scripts.push(buildBanPickChart("enemyChart", "Баны и пики — Противники", stats.enemy, stats.decider))
  if (hasDeciderWr) scripts.push(buildDeciderWinRateChart("deciderWrChart", stats.deciderWinRate))

  // Таб: Винрейт
  if (hasWinRate) scripts.push(buildWinRateChart("winRateChart", stats.mapWinRate))
  if (hasComp) scripts.push(buildCompetitionChart("compChart", stats.competitionStats))

  // Таб: Тренды
  if (hasTrends) {
    scripts.push(buildTrendChart("trendFirstBan", "Тренды первых банов", stats.trends, "firstBan"))
    scripts.push(buildTrendChart("trendSecondBan", "Тренды вторых банов", stats.trends, "secondBan"))
    scripts.push(buildTrendChart("trendThirdBan", "Тренды последних банов", stats.trends, "thirdBan"))
    scripts.push(buildTrendChart("trendFirstPick", "Тренды пиков (BO3)", stats.trends, "firstPick"))
    scripts.push(buildWinRateTrendChart("wrTrendChart", stats.trends))
    scripts.push(buildMatchCountChart("matchCountChart", stats.trends))
  }
  if (hasElo) scripts.push(buildEloChart("eloChart", stats.eloHistory))

  // Таб: Обзор
  if (hasComp) scripts.push(buildCompetitionPieChart("compPieChart", stats.competitionStats))

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Статистика — ${teamName}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>${REPORT_STYLES}</style>
</head>
<body>
  ${buildHeader(`Статистика — ${teamName}`, stats.mapInfo, stats.earliestGame, stats.latestGame, stats.allCount)}
  ${buildTabs(["Баны/Пики", "Винрейт", "Тренды", "Обзор"])}

  <div class="tab-content active" id="tab-баны/пики">
    <canvas id="targetChart" width="800" height="400"></canvas>
    <h2 class="section-title">Противники</h2>
    <canvas id="enemyChart" width="800" height="400"></canvas>
    ${hasDeciderWr ? `<h2 class="section-title">Десайдер — винрейт</h2><canvas id="deciderWrChart" width="800" height="300"></canvas>` : ""}
  </div>

  <div class="tab-content" id="tab-винрейт">
    ${hasWinRate ? `${buildWinRateTable(stats.mapWinRate)}<canvas id="winRateChart" width="800" height="400"></canvas>` : "<p>Нет данных о винрейте</p>"}
    ${hasFU ? `<h2 class="section-title">Фаворит vs Андердог</h2>${buildFavoriteUnderdogCards(stats.favoriteUnderdog)}` : ""}
    ${hasComp ? `<h2 class="section-title">По типу соревнования</h2><canvas id="compChart" width="800" height="250"></canvas>` : ""}
  </div>

  <div class="tab-content" id="tab-тренды">
    ${hasTrends ? `
    <h2>Тренды банов/пиков</h2>
    <div class="trend-select">
      <select id="trendPhaseSelect">
        <option value="firstBan">Первый бан</option>
        <option value="secondBan">Второй бан</option>
        <option value="thirdBan">Последний бан</option>
        <option value="firstPick">Пик (BO3)</option>
      </select>
    </div>
    <div id="trend-firstBan" class="trend-canvas active"><canvas id="trendFirstBan" width="800" height="350"></canvas></div>
    <div id="trend-secondBan" class="trend-canvas"><canvas id="trendSecondBan" width="800" height="350"></canvas></div>
    <div id="trend-thirdBan" class="trend-canvas"><canvas id="trendThirdBan" width="800" height="350"></canvas></div>
    <div id="trend-firstPick" class="trend-canvas"><canvas id="trendFirstPick" width="800" height="350"></canvas></div>

    <h2 class="section-title">Тренды винрейта</h2>
    <canvas id="wrTrendChart" width="800" height="350"></canvas>

    <h2 class="section-title">Количество матчей</h2>
    <canvas id="matchCountChart" width="800" height="250"></canvas>
    ` : "<p>Недостаточно данных для трендов (нужно минимум 2 месяца)</p>"}

    ${hasElo ? `<h2 class="section-title">Динамика ELO</h2><canvas id="eloChart" width="800" height="350"></canvas>` : ""}
  </div>

  <div class="tab-content" id="tab-обзор">
    ${buildSummaryCards(stats.allCount, stats.count, stats.avgElo, stats.mapWinRate, stats.earliestGame, stats.latestGame)}
    ${hasComp ? `<h2>Распределение по типу</h2><canvas id="compPieChart" width="400" height="400" style="max-width:400px;margin:0 auto;display:block;"></canvas>` : ""}
  </div>

  <script>
${scripts.filter(Boolean).join("\n")}
${TAB_SCRIPT}
  </script>
</body>
</html>`
}
