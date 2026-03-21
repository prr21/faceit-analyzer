const allStat = {
  target: {
    banFirst: {
      de_overpass: 2,
      de_inferno: 7,
      de_mirage: 8,
      de_train: 1,
    },
    firstPick: {
      de_ancient: 1,
      de_train: 1,
      de_mirage: 1,
      de_nuke: 2,
    },
    secondBan: {
      de_inferno: 4,
      de_mirage: 2,
      de_overpass: 3,
      de_train: 2,
      de_dust2: 2,
    },
    thirdBan: {
      de_train: 4,
      de_ancient: 6,
      de_inferno: 2,
      de_overpass: 4,
      de_mirage: 1,
    },
  },
  enemy: {
    banFirst: {
      de_ancient: 5,
      de_overpass: 1,
      de_train: 2,
      de_dust2: 1,
      de_nuke: 6,
      de_inferno: 2,
      de_mirage: 1,
    },
    firstPick: {
      de_dust2: 3,
      de_train: 1,
      de_ancient: 1,
    },
    secondBan: {
      de_mirage: 3,
      de_train: 2,
      de_ancient: 1,
      de_overpass: 2,
      de_nuke: 2,
      de_dust2: 1,
      de_inferno: 2,
    },
    thirdBan: {
      de_nuke: 3,
      de_dust2: 3,
      de_train: 4,
      de_mirage: 2,
      de_overpass: 3,
      de_ancient: 2,
    },
  },
  decider: {
    de_dust2: 8,
    de_nuke: 4,
    de_overpass: 2,
    de_train: 1,
    de_ancient: 2,
    de_inferno: 1,
  },
  earliestGame: "26.10.2025, 12:56:32",
  latestGame: "22.11.2025, 16:06:18",
  mapInfo:
    'Анализ на основе 18 матчей, в котором играли минимум 3 человека из команды "Satanics Aura"',
  count: 18,
  allCount: 500,
}

const stats = allStat.target

// Статистика команды target
// Извлечение уникальных карт
const allMaps = [
  ...new Set([
    ...Object.keys(stats.banFirst),
    ...Object.keys(stats.firstPick),
    ...Object.keys(stats.secondBan),
    ...Object.keys(allStat.decider),
  ]),
]

// Подготовка данных для диаграммы
const banFirstData = allMaps.map(map => stats.banFirst[map] || 0)
const firstPickData = allMaps.map(map => stats.firstPick[map] || 0)
const secondBanData = allMaps.map(map => stats.secondBan[map] || 0)
const thirdBanData = allMaps.map(map => stats.thirdBan[map] || 0)
const decider = allMaps.map(map => allStat.decider[map] || 0)

// Создание диаграммы
const ctx = document.getElementById("mapStatsChart").getContext("2d")
new Chart(ctx, {
  type: "bar",
  data: {
    labels: allMaps,
    datasets: [
      {
        label: "Первый бан",
        data: banFirstData,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Второй бан",
        data: secondBanData,
        backgroundColor: "rgba(230, 151, 62, 0.6)",
        borderColor: "rgba(230, 151, 62, 1)",
        borderWidth: 1,
      },
      {
        label: "Третий бан",
        data: thirdBanData,
        backgroundColor: "rgba(220, 223, 74, 0.6)",
        borderColor: "rgba(220, 223, 74, 1)",
        borderWidth: 1,
      },
      {
        label: "Первый пик (BO3)",
        data: firstPickData,
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
      {
        label: "Сыграно",
        data: decider,
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
      title: { display: true, text: "Статистика банов и пиков (Target)" },
    },
    scales: {
      x: { stacked: false }, // Карты не "стакаются"
      y: { beginAtZero: true },
    },
  },
})

document.getElementById(
  "silance4"
).textContent = `Всего проанализировано ${allStat.allCount} матчей`
document.getElementById("silance").textContent = allStat.mapInfo
document.getElementById("silance2").textContent = allStat.earliestGame
document.getElementById("silance3").textContent = allStat.latestGame
