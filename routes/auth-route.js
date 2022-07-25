//* import the validate string function from the validate-string module
const { validate } = require('../other/validate-string');

//* handle a post request on this route
async function post(req, res, db) {
  //* get the token from the post request body
  const token = req.body.token

  //* if the token is not defined, send an error as response
  const tokenValidation = validate(token)
  if (!tokenValidation.valid) {
    res.json({
      status: 'error',
      message: `Token is invalid, reason: ${tokenValidation.reason}`
    })

    return
  }

  try {
    //* find user by token
    const user = await db.models.User.findOne({
      where: {
        token
      }
    })

    //* if no user if found, send an error as response
    if (user === null) {
      res.json({
        status: 'error',
        message: 'No user found'
      })

      return
    }

    //* if the token is valid, send a success response containing the user data 
    res.json({
      status: 'success',
      user
    })
  }
  catch (err) { //* catch any errors that might arise during this process 
    res.json({
      status: 'error',
      message: `Could not authenticate token, reason: ${err.message}`
    })
  }
}

module.exports = {
  post
}