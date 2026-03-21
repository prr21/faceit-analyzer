const f = (uid, page) =>
  fetch(
    `https://www.faceit.com/api/championships/v1/championship/${uid}/subscription?limit=20&offset=${
      page * 20
    }`,
    {
      headers: {
        accept: "*/*",
      },
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  )
    .then(a => a.json())
    .then(a => a.payload)

const fPlayer = uid =>
  fetch(`https://www.faceit.com/api/users/v1/users/${uid}`, {
    headers: {
      accept: "*/*",
    },
    method: "GET",
    mode: "cors",
    credentials: "include",
  })
    .then(a => a.json())
    .then(a => a.payload)

function getTeamsWithPlayersInfo(teams) {
  return Promise.all(
    teams.map(async teamInfo => {
      const allPlayerUids = [...teamInfo.roster, ...teamInfo.substitutes]
      const playersInfo = await Promise.all(allPlayerUids.map(fPlayer))

      return { team_name: teamInfo.team.name, players: playersInfo }
    })
  )
}

async function getAllTeamsFromTournament(uid) {
  const allTeams = []
  let index = 0

  do {
    const payload = await f(uid, index)
    const teams = payload.items
    allTeams.push(...teams)
    if (teams.length === 0) {
      break
    }
  } while (++index < 10)

  return allTeams
}

function calculateTeamElo(team) {
  const elos = team.players.map(player => player.games["cs2"].faceit_elo)
  const sortedElos = elos.sort((a, b) => b - a)

  const high5Elos = sortedElos.slice(0, 5)
  const elosAvg = high5Elos.reduce((acc, elo) => (acc += elo), 0) / 5

  return {
    team_name: team.team_name,
    elosAvg,
    sortedElos: sortedElos.join(", "),
  }
}

async function tournamentOverview(uid) {
  const teams = await getAllTeamsFromTournament(uid)
  const teamsWithPlayers = await getTeamsWithPlayersInfo(teams)
  const teamWithElos = teamsWithPlayers.map(calculateTeamElo)

  const teamsInfoForConsoleTable = teamWithElos
    .sort((a, b) => b.elosAvg - a.elosAvg)
    .map(team => {
      return {
        "team name": team.team_name,
        "elo avg by 5 highest players": team.elosAvg,
        "sorted elos": team.sortedElos,
      }
    })

  console.table(teamsInfoForConsoleTable)
  return teamWithElos
}

await tournamentOverview("3bb89ca8-0cd7-44e8-995e-90ff25a8ef3b")
