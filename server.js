require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Sequelize, DataTypes } = require('sequelize')

const LoginRoute = require('./routes/login-route')
const SignupRoute = require('./routes/signup-route')
const AuthRoute = require('./routes/auth-route')
const FindPathRoute = require('./routes/find-path-route')

// const dataTrains = require('./dataset/q-trains.json')
const dataStations = require('./dataset/q-stations.json')
const dataGraph = require('./dataset/q-graph.json')

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
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  }
})

//? start up process
async function main() {
  //? start the express server
  app.listen(process.env.PORT | 1001, () => {
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
app.post('/login', async (req, res) => {
  LoginRoute.post(req, res, usersSequelize)
})

//? POST /signup
app.post('/signup', async (req, res) => {
  SignupRoute.post(req, res, usersSequelize)
})

//? POST /auth
app.post('/auth', async (req, res) => {
  AuthRoute.post(req, res, usersSequelize)
})

//? GET /data/trains
// app.get('/data/trains', async (req, res) => {
//   res.json(dataTrains)
// })

//? GET /data/stations
app.get('/data/stations', async (req, res) => {
  res.json(dataStations)
})

//? GET /data/graph
app.get('/data/graph', async (req, res) => {
  FindPathRoute.get(req, res, dataGraph)
})


//? GET /path
app.get('/path', async (req, res) => {
  FindPathRoute.get(req, res, dataGraph.graph)
})

main()