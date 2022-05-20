require('dotenv').config()
const { validate } = require('../other/validate-string')
const { sha256 } = require('js-sha256')

async function post(req, res, db) {
  const username = req.body.username
  const password = req.body.password

  const usernameValidation = validate(username)
  if (!usernameValidation.valid) {
    res.json({
      status: 'error',
      message: `Username is invalid, reason: ${usernameValidation.reason}`
    })

    return
  }

  const passwordValidation = validate(password)
  if (!passwordValidation.valid) {
    res.json({
      status: 'error',
      message: `Password is invalid, reason: ${passwordValidation.reason}`
    })

    return
  }

  const hashedPassword = sha256(process.env.PASSWORD_ENCRYPTION_ADDON + password)

  const user = await db.models.User.findOne({
    where: {
      username
    }
  })

  if (user === null) {
    res.json({
      status: 'error',
      message: 'Username not found'
    })

    return
  }

  if (user.password !== hashedPassword) {
    res.json({
      status: 'error',
      message: 'Password is incorrect'
    })

    return
  }

  res.json({
    status: 'success',
    user
  })
}

module.exports = {
  post
}