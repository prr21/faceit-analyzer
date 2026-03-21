import type { TeamDropPickStats, FactionBanPickStats } from "../types/faceit.js"

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

function buildChartScript(
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

export function generateHtmlReport(teamName: string, stats: TeamDropPickStats): string {
  const targetChart = buildChartScript("targetChart", `Статистика банов и пиков — ${teamName}`, stats.target, stats.decider)
  const enemyChart = buildChartScript("enemyChart", "Статистика банов и пиков — Противники", stats.enemy, stats.decider)

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

  <script>
${targetChart}
${enemyChart}
  </script>
</body>
</html>`
}
