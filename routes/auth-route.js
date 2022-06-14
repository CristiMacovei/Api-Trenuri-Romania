require('dotenv').config()
const { validate } = require('../other/validate-string')

async function post(req, res, db) {
  const token = req.body.token

  const tokenValidation = validate(token)
  if (!tokenValidation.valid) {
    res.json({
      status: 'error',
      message: `Token is invalid, reason: ${tokenValidation.reason}`
    })

    return
  }

  try {
    const user = await db.models.User.findOne({
      where: {
        token
      }
    })

    if (user === null) {
      res.json({
        status: 'error',
        message: 'No user found'
      })

      return
    }

    res.json({
      status: 'success',
      user
    })
  }
  catch (err) {
    res.json({
      status: 'error',
      message: `Could not authenticate token, reason: ${err.message}`
    })
  }
}

module.exports = {
  post
}