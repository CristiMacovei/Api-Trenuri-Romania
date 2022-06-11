const { validate } = require('../other/validate-string')

async function get(req, res, stations, db) {
  const token = req.headers.authorization

  const tokenValidation = validate(token)
  if (!tokenValidation.valid) {
    res.json({
      status: 'error',
      message: `Token is invalid, reason: ${tokenValidation.reason}`
    })

    return
  }

  const user = await db.models.User.findOne({
    token
  })

  if (user === null) {
    res.json({
      status: 'error',
      message: 'No user found'
    })

    return
  }

  //? fetch history
  const history = await db.models.HistoryEntry.findAll({
    where: {
      userToken: token
    }
  })

  res.json({
    status: 'success',
    history: history.map(({
      originId,
      destId
    }) => ({
      origin: stations.find(station => station.stationId === originId).stationName,
      destination: stations.find(station => station.stationId === destId).stationName
    }))
  })
}

module.exports = {
  get
}