//* import the validate string function from the validate-string module
const { validate } = require('../other/validate-string');

//* this function handles a get request on this path
async function get(req, res, stations, db) {
  //* verify token and get user data
  const token = req.headers.authorization;

  const tokenValidation = validate(token)
  if (!tokenValidation.valid) {
    res.json({
      status: 'error',
      message: `Token is invalid, reason: ${tokenValidation.reason}`
    });

    return;
  }

  const user = await db.models.User.findOne({
    where: {
      token
    }
  });

  if (user === null) {
    res.json({
      status: 'error',
      message: 'No user found'
    });

    return;
  }

  //* fetch user's history from the database
  const history = await db.models.HistoryEntry.findAll({
    where: {
      userToken: token
    }
  });

  //* send the response
  res.json({
    status: 'success',
    history: history.map(({
      originId,
      destId
    }) => ({
      origin: stations.find(station => station.stationId === originId).stationName,
      destination: stations.find(station => station.stationId === destId).stationName
    }))
  });
}

//* export the handler function
module.exports = {
  get
}
