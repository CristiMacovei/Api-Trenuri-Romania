require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Sequelize, DataTypes } = require('sequelize')

const LoginRoute = require('./routes/login-route')
const SignupRoute = require('./routes/signup-route')

//? initialise the app
const app = express()
app.use(express.json())
app.use(cors())

//? initialise the database
const usersSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/users.sqlite3',
})

usersSequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  }
})

//? start up process
async function main() {
  //? start the express server
  app.listen(1001, () => {
    console.log('running on rocket fuel')
  })

  //? sync the database
  try {
    await usersSequelize.sync({ alter : true })
  }
  catch (err) {
    console.log('Could not connect to users database')
    console.log(err)
  }
}

//? POST /login
app.post('/login', async (req, res) => LoginRoute.post(req, res, usersSequelize))

//? POST /signup
app.post('/signup', async (req, res) => SignupRoute.post(req, res, usersSequelize))

main()