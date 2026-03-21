import type { TeamDropPickStats, FactionBanPickStats, MapWinRate, TrendPeriod } from "../types/faceit.js"

function collectAllMaps(factionStats: FactionBanPickStats, decider: Record<string, number>): string[] {
  return [
    ...new Set([
      ...Object.keys(factionStats.firstBan),
      ...Object.keys(factionStats.firstPick),
      ...Object.keys(factionStats.secondBan),
      ...Object.keys(factionStats.thirdBan),
      ...Object.keys(decider),
    ]),
  ]
}

function buildBanPickChart(
  canvasId: string,
  title: string,
  factionStats: FactionBanPickStats,
  decider: Record<string, number>,
): string {
  const allMaps = collectAllMaps(factionStats, decider)

  return `
  {
    const maps = ${JSON.stringify(allMaps)};
    const stats = ${JSON.stringify(factionStats)};
    const decider = ${JSON.stringify(decider)};

    const ctx = document.getElementById("${canvasId}").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: maps,
        datasets: [
          {
            label: "Первый бан",
            data: maps.map(m => stats.firstBan[m] || 0),
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
          {
            label: "Второй бан (BO1)",
            data: maps.map(m => stats.secondBan[m] || 0),
            backgroundColor: "rgba(230, 151, 62, 0.6)",
            borderColor: "rgba(230, 151, 62, 1)",
            borderWidth: 1,
          },
          {
            label: "Последний бан",
            data: maps.map(m => stats.thirdBan[m] || 0),
            backgroundColor: "rgba(220, 223, 74, 0.6)",
            borderColor: "rgba(220, 223, 74, 1)",
            borderWidth: 1,
          },
          {
            label: "Первый пик (BO3)",
            data: maps.map(m => stats.firstPick[m] || 0),
            backgroundColor: "rgba(153, 102, 255, 0.6)",
            borderColor: "rgba(153, 102, 255, 1)",
            borderWidth: 1,
          },
          {
            label: "Сыграно (десайдер)",
            data: maps.map(m => decider[m] || 0),
            backgroundColor: "rgba(102, 255, 127, 0.6)",
            borderColor: "rgba(102, 255, 127, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: ${JSON.stringify(title)} },
        },
        scales: {
          x: { stacked: false },
          y: { beginAtZero: true },
        },
      },
    });
  }`
}

function buildWinRateChart(winRate: Record<string, MapWinRate>): string {
  const maps = Object.keys(winRate)
  if (maps.length === 0) return ""

  return `
  {
    const wr = ${JSON.stringify(winRate)};
    const maps = ${JSON.stringify(maps)};

    const ctx = document.getElementById("winRateChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: maps,
        datasets: [
          {
            label: "Победы",
            data: maps.map(m => wr[m].wins),
            backgroundColor: "rgba(75, 192, 75, 0.7)",
            borderColor: "rgba(75, 192, 75, 1)",
            borderWidth: 1,
          },
          {
            label: "Поражения",
            data: maps.map(m => wr[m].losses),
            backgroundColor: "rgba(255, 75, 75, 0.7)",
            borderColor: "rgba(255, 75, 75, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: "Винрейт по картам" },
          tooltip: {
            callbacks: {
              afterBody: function(ctx) {
                const map = ctx[0].label;
                return "Винрейт: " + wr[map].rate + "% (" + wr[map].total + " игр)";
              }
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true },
        },
      },
    });
  }`
}

function buildTrendChart(trends: TrendPeriod[]): string {
  if (trends.length < 2) return ""

  const labels = trends.map(t => t.label)
  // Собираем все карты из firstBan всех периодов
  const allBanMaps = [...new Set(trends.flatMap(t => Object.keys(t.stats.firstBan)))]
  const colors = [
    "rgba(255, 99, 132, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(75, 192, 192, 1)",
    "rgba(153, 102, 255, 1)",
    "rgba(255, 159, 64, 1)",
    "rgba(199, 199, 199, 1)",
  ]

  const datasets = allBanMaps.map((mapName, i) => ({
    label: mapName,
    data: trends.map(t => t.stats.firstBan[mapName] || 0),
    borderColor: colors[i % colors.length],
    backgroundColor: "transparent",
    borderWidth: 2,
    tension: 0.3,
  }))

  return `
  {
    const ctx = document.getElementById("trendChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: ${JSON.stringify(datasets)},
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: "Тренды первых банов по месяцам" },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }`
}

function buildWinRateTable(winRate: Record<string, MapWinRate>): string {
  const entries = Object.entries(winRate).sort((a, b) => b[1].rate - a[1].rate)
  if (entries.length === 0) return ""

  const rows = entries.map(([map, wr]) =>
    `<tr><td>${map}</td><td>${wr.wins}</td><td>${wr.losses}</td><td>${wr.total}</td><td><strong>${wr.rate}%</strong></td></tr>`
  ).join("\n      ")

  return `
    <table class="wr-table">
      <thead><tr><th>Карта</th><th>W</th><th>L</th><th>Всего</th><th>Винрейт</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

export function generateHtmlReport(teamName: string, stats: TeamDropPickStats): string {
  const targetChart = buildBanPickChart("targetChart", `Статистика банов и пиков — ${teamName}`, stats.target, stats.decider)
  const enemyChart = buildBanPickChart("enemyChart", "Статистика банов и пиков — Противники", stats.enemy, stats.decider)
  const winRateChart = buildWinRateChart(stats.mapWinRate)
  const trendChart = buildTrendChart(stats.trends)
  const winRateTable = buildWinRateTable(stats.mapWinRate)

  const hasWinRate = Object.keys(stats.mapWinRate).length > 0
  const hasTrends = stats.trends.length >= 2

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Статистика банов — ${teamName}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { margin-bottom: 4px; }
    .meta { color: #555; margin: 4px 0; }
    .dates { display: flex; gap: 30px; margin: 8px 0 20px; }
    .date-item { display: flex; gap: 8px; }
    .date-label { color: #777; }
    canvas { margin-bottom: 40px; }
    .section-title { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
    .wr-table { border-collapse: collapse; margin: 12px 0 30px; }
    .wr-table th, .wr-table td { border: 1px solid #ddd; padding: 6px 14px; text-align: center; }
    .wr-table th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Статистика банов и пиков — ${teamName}</h1>
  <p class="meta">${stats.mapInfo}</p>
  <div class="dates">
    <div class="date-item">
      <span class="date-label">Самая ранняя игра:</span>
      <span>${stats.earliestGame}</span>
    </div>
    <div class="date-item">
      <span class="date-label">Самая последняя игра:</span>
      <span>${stats.latestGame}</span>
    </div>
  </div>
  <p class="meta">Всего проанализировано ${stats.allCount} матчей</p>

  <canvas id="targetChart" width="800" height="400"></canvas>

  <h2 class="section-title">Статистика противников</h2>
  <canvas id="enemyChart" width="800" height="400"></canvas>

${hasWinRate ? `
  <h2 class="section-title">Винрейт по картам</h2>
  ${winRateTable}
  <canvas id="winRateChart" width="800" height="400"></canvas>
` : ""}

${hasTrends ? `
  <h2 class="section-title">Тренды по месяцам</h2>
  <canvas id="trendChart" width="800" height="400"></canvas>
` : ""}

  <script>
${targetChart}
${enemyChart}
${winRateChart}
${trendChart}
  </script>
</body>
</html>`
}
