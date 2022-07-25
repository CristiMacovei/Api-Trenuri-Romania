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
  const usernameValidation = validate(username);
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

  //* find the user by their username
  const user = await db.models.User.findOne({
    where: {
      username
    }
  });

  //* if nothing is found, return an error
  if (user === null) {
    res.json({
      status: 'error',
      message: 'Username not found'
    });

    return;
  }

  //* compare the hashed password against the one stored in the database
  //* if they don't match, send an error, otherwise log the user in and send them their data 
  if (user.password !== hashedPassword) {
    res.json({
      status: 'error',
      message: 'Password is incorrect'
    });

    return;
  }

  res.json({
    status: 'success',
    user
  });
}

//* export the handler function
module.exports = {
  post
};