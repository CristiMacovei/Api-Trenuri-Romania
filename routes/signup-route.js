//* dotenv is required for the addons used for the sha algorithm  
require('dotenv').config();

//* import the validate string function from the validate-string module
const { validate } = require('../other/validate-string');

//* sha algorithm for database security
const { sha256 } = require('js-sha256');

//* this function handles a post request on this route
async function post(req, res, db) {
  //* get the username and password from the request's body
  const username = req.body.username;
  const password = req.body.password;

  //* validate credentials
  const usernameValidation = validate(username)
  if (!usernameValidation.valid) {
    res.json({
      status: 'error',
      message: `Username is invalid, reason: ${usernameValidation.reason}`
    });

    return;
  }

  const passwordValidation = validate(password);
  if (!passwordValidation.valid) {
    res.json({
      status: 'error',
      message: `Password is invalid, reason: ${passwordValidation.reason}`
    });

    return;
  }

  //* hash the plain text password using sha-256
  const hashedPassword = sha256(process.env.PASSWORD_ENCRYPTION_ADDON + password);

  //* generate the unique token
  const token = sha256(process.env.TOKEN_ENCRYPTION_ADDON + username + password);

  //* try to save the user in the database, send an error if it fails
  try {
    const user = await db.models.User.create({
      username,
      password: hashedPassword,
      token
    });

    res.json({
      status: 'success',
      user
    });
  }
  catch (err) {
    res.json({
      status: 'error',
      message: `Could not create user, reason: ${err.message}`
    });
  }
}

//* export the handler function
module.exports = {
  post
};