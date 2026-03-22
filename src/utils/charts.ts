import type { FactionBanPickStats, MapWinRate, TrendPeriod, EloSnapshot, CompetitionTypeStats, FavoriteUnderdogStats } from "../types/faceit.js"

const MAP_COLORS = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
  "rgba(199, 199, 199, 1)",
  "rgba(83, 102, 255, 1)",
]

export function collectAllMaps(factionStats: FactionBanPickStats, decider: Record<string, number>): string[] {
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

export function buildBanPickChart(
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

    new Chart(document.getElementById("${canvasId}"), {
      type: "bar",
      data: {
        labels: maps,
        datasets: [
          { label: "Первый бан", data: maps.map(m => stats.firstBan[m] || 0), backgroundColor: "rgba(255, 99, 132, 0.6)", borderColor: "rgba(255, 99, 132, 1)", borderWidth: 1 },
          { label: "Второй бан (BO1)", data: maps.map(m => stats.secondBan[m] || 0), backgroundColor: "rgba(230, 151, 62, 0.6)", borderColor: "rgba(230, 151, 62, 1)", borderWidth: 1 },
          { label: "Последний бан", data: maps.map(m => stats.thirdBan[m] || 0), backgroundColor: "rgba(220, 223, 74, 0.6)", borderColor: "rgba(220, 223, 74, 1)", borderWidth: 1 },
          { label: "Первый пик (BO3)", data: maps.map(m => stats.firstPick[m] || 0), backgroundColor: "rgba(153, 102, 255, 0.6)", borderColor: "rgba(153, 102, 255, 1)", borderWidth: 1 },
          { label: "Сыграно (десайдер)", data: maps.map(m => decider[m] || 0), backgroundColor: "rgba(102, 255, 127, 0.6)", borderColor: "rgba(102, 255, 127, 1)", borderWidth: 1 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true }, title: { display: true, text: ${JSON.stringify(title)} } },
        scales: { x: { stacked: false }, y: { beginAtZero: true } },
      },
    });
  }`
}

export function buildWinRateChart(canvasId: string, winRate: Record<string, MapWinRate>): string {
  const maps = Object.keys(winRate)
  if (maps.length === 0) return ""

  return `
  {
    const wr = ${JSON.stringify(winRate)};
    const maps = ${JSON.stringify(maps)};
    new Chart(document.getElementById("${canvasId}"), {
      type: "bar",
      data: {
        labels: maps,
        datasets: [
          { label: "Победы", data: maps.map(m => wr[m].wins), backgroundColor: "rgba(75, 192, 75, 0.7)", borderColor: "rgba(75, 192, 75, 1)", borderWidth: 1 },
          { label: "Поражения", data: maps.map(m => wr[m].losses), backgroundColor: "rgba(255, 75, 75, 0.7)", borderColor: "rgba(255, 75, 75, 1)", borderWidth: 1 },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: "Винрейт по картам" },
          tooltip: { callbacks: { afterBody: function(ctx) { const map = ctx[0].label; return "Винрейт: " + wr[map].rate + "% (" + wr[map].total + " игр)"; } } }
        },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      },
    });
  }`
}

export function buildDeciderWinRateChart(canvasId: string, deciderWinRate: Record<string, MapWinRate>): string {
  const maps = Object.keys(deciderWinRate)
  if (maps.length === 0) return ""

  return `
  {
    const dwr = ${JSON.stringify(deciderWinRate)};
    const maps = ${JSON.stringify(maps)};
    new Chart(document.getElementById("${canvasId}"), {
      type: "bar",
      data: {
        labels: maps,
        datasets: [
          { label: "Победы", data: maps.map(m => dwr[m].wins), backgroundColor: "rgba(75, 192, 75, 0.7)", borderColor: "rgba(75, 192, 75, 1)", borderWidth: 1 },
          { label: "Поражения", data: maps.map(m => dwr[m].losses), backgroundColor: "rgba(255, 75, 75, 0.7)", borderColor: "rgba(255, 75, 75, 1)", borderWidth: 1 },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: "Винрейт на десайдере" },
          tooltip: { callbacks: { afterBody: function(ctx) { const map = ctx[0].label; return "Винрейт: " + dwr[map].rate + "% (" + dwr[map].total + " игр)"; } } }
        },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      },
    });
  }`
}

export function buildTrendChart(canvasId: string, title: string, trends: TrendPeriod[], dataKey: "firstBan" | "firstPick" | "secondBan" | "thirdBan"): string {
  if (trends.length < 2) return ""

  const labels = trends.map(t => t.label)
  const allMaps = [...new Set(trends.flatMap(t => Object.keys(t.stats[dataKey])))]

  const datasets = allMaps.map((mapName, i) => ({
    label: mapName,
    data: trends.map(t => t.stats[dataKey][mapName] || 0),
    borderColor: MAP_COLORS[i % MAP_COLORS.length],
    backgroundColor: "transparent",
    borderWidth: 2,
    tension: 0.3,
  }))

  return `
  {
    new Chart(document.getElementById("${canvasId}"), {
      type: "line",
      data: { labels: ${JSON.stringify(labels)}, datasets: ${JSON.stringify(datasets)} },
      options: {
        responsive: true,
        plugins: { legend: { display: true }, title: { display: true, text: ${JSON.stringify(title)} } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }`
}

export function buildWinRateTrendChart(canvasId: string, trends: TrendPeriod[]): string {
  if (trends.length < 2) return ""

  const labels = trends.map(t => t.label)
  const allMaps = [...new Set(trends.flatMap(t => Object.keys(t.mapWinRate)))]

  const datasets = allMaps.map((mapName, i) => ({
    label: mapName,
    data: trends.map(t => t.mapWinRate[mapName]?.rate ?? null),
    borderColor: MAP_COLORS[i % MAP_COLORS.length],
    backgroundColor: "transparent",
    borderWidth: 2,
    tension: 0.3,
    spanGaps: true,
  }))

  return `
  {
    new Chart(document.getElementById("${canvasId}"), {
      type: "line",
      data: { labels: ${JSON.stringify(labels)}, datasets: ${JSON.stringify(datasets)} },
      options: {
        responsive: true,
        plugins: { legend: { display: true }, title: { display: true, text: "Тренды винрейта по месяцам (%)" } },
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });
  }`
}

export function buildMatchCountChart(canvasId: string, trends: TrendPeriod[]): string {
  if (trends.length < 2) return ""

  return `
  {
    new Chart(document.getElementById("${canvasId}"), {
      type: "bar",
      data: {
        labels: ${JSON.stringify(trends.map(t => t.label))},
        datasets: [{
          label: "Матчей",
          data: ${JSON.stringify(trends.map(t => t.matchCount))},
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: "Количество матчей по месяцам" } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }`
}

export function buildEloChart(canvasId: string, eloHistory: EloSnapshot[]): string {
  if (eloHistory.length < 2) return ""

  const labels = eloHistory.map(e => new Date(e.date * 1000).toLocaleDateString("ru-RU"))
  const pointColors = eloHistory.map(e => e.result === "win" ? "rgba(75, 192, 75, 1)" : "rgba(255, 75, 75, 1)")

  return `
  {
    new Chart(document.getElementById("${canvasId}"), {
      type: "line",
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [{
          label: "ELO",
          data: ${JSON.stringify(eloHistory.map(e => e.elo))},
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "transparent",
          borderWidth: 2,
          tension: 0.2,
          pointBackgroundColor: ${JSON.stringify(pointColors)},
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: "Динамика ELO" } },
      },
    });
  }`
}

export function buildCompetitionChart(canvasId: string, compStats: CompetitionTypeStats): string {
  const types = Object.keys(compStats)
  if (types.length === 0) return ""

  return `
  {
    const cs = ${JSON.stringify(compStats)};
    const types = ${JSON.stringify(types)};
    new Chart(document.getElementById("${canvasId}"), {
      type: "bar",
      data: {
        labels: types,
        datasets: [
          { label: "Победы", data: types.map(t => cs[t].wins), backgroundColor: "rgba(75, 192, 75, 0.7)" },
          { label: "Поражения", data: types.map(t => cs[t].losses), backgroundColor: "rgba(255, 75, 75, 0.7)" },
        ],
      },
      options: {
        responsive: true,
        indexAxis: "y",
        plugins: {
          legend: { display: true },
          title: { display: true, text: "Винрейт по типу соревнования" },
          tooltip: { callbacks: { afterBody: function(ctx) { const t = ctx[0].label; return "Винрейт: " + cs[t].rate + "% (" + cs[t].total + " игр)"; } } }
        },
        scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true } },
      },
    });
  }`
}

export function buildCompetitionPieChart(canvasId: string, compStats: CompetitionTypeStats): string {
  const types = Object.keys(compStats)
  if (types.length === 0) return ""

  const pieColors = [
    "rgba(54, 162, 235, 0.7)",
    "rgba(255, 206, 86, 0.7)",
    "rgba(153, 102, 255, 0.7)",
    "rgba(255, 159, 64, 0.7)",
  ]

  return `
  {
    const cs = ${JSON.stringify(compStats)};
    const types = ${JSON.stringify(types)};
    new Chart(document.getElementById("${canvasId}"), {
      type: "doughnut",
      data: {
        labels: types,
        datasets: [{
          data: types.map(t => cs[t].total),
          backgroundColor: ${JSON.stringify(pieColors.slice(0, types.length))},
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true }, title: { display: true, text: "Распределение по типу соревнования" } },
      },
    });
  }`
}

export function buildWinRateTable(winRate: Record<string, MapWinRate>): string {
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

export function buildFavoriteUnderdogCards(fu: FavoriteUnderdogStats): string {
  return `
    <div class="cards-row">
      <div class="card">
        <div class="card-title">Как фаворит</div>
        <div class="card-value ${fu.asFavorite.rate >= 50 ? "green" : "red"}">${fu.asFavorite.rate}%</div>
        <div class="card-sub">${fu.asFavorite.wins}W / ${fu.asFavorite.losses}L (${fu.asFavorite.total} игр)</div>
      </div>
      <div class="card">
        <div class="card-title">Как андердог</div>
        <div class="card-value ${fu.asUnderdog.rate >= 50 ? "green" : "red"}">${fu.asUnderdog.rate}%</div>
        <div class="card-sub">${fu.asUnderdog.wins}W / ${fu.asUnderdog.losses}L (${fu.asUnderdog.total} игр)</div>
      </div>
    </div>`
}

export function buildSummaryCards(
  totalMatches: number,
  analyzedMatches: number,
  avgElo: number,
  overallWinRate: Record<string, MapWinRate>,
  earliestGame: string,
  latestGame: string,
): string {
  let totalWins = 0, totalLosses = 0
  for (const wr of Object.values(overallWinRate)) {
    totalWins += wr.wins
    totalLosses += wr.losses
  }
  const totalGames = totalWins + totalLosses
  const overallRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

  return `
    <div class="cards-row">
      <div class="card">
        <div class="card-title">Всего матчей</div>
        <div class="card-value">${totalMatches}</div>
        <div class="card-sub">Проанализировано: ${analyzedMatches}</div>
      </div>
      <div class="card">
        <div class="card-title">Общий винрейт</div>
        <div class="card-value ${overallRate >= 50 ? "green" : "red"}">${overallRate}%</div>
        <div class="card-sub">${totalWins}W / ${totalLosses}L</div>
      </div>
      <div class="card">
        <div class="card-title">Средний ELO</div>
        <div class="card-value">${avgElo || "—"}</div>
      </div>
      <div class="card">
        <div class="card-title">Период</div>
        <div class="card-value" style="font-size:14px">${earliestGame || "—"}</div>
        <div class="card-sub">${latestGame || "—"}</div>
      </div>
    </div>`
}
