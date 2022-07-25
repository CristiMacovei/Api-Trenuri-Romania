//* dotenv is required because a port might be specified in the env file
require('dotenv').config();

//* express is the framework required for the server to run
const express = require('express');

//* cors is used to allow external clients (ie the frontend of the app) to access this server
const cors = require('cors');

//* sequelize is used to connect to the database
const { Sequelize, DataTypes } = require('sequelize');


//* import all routes' handler functions
const LoginRoute = require('./routes/login-route');
const SignupRoute = require('./routes/signup-route');
const AuthRoute = require('./routes/auth-route');
const FindPathRoute = require('./routes/find-path-route');
const HistoryRoute = require('./routes/history-route');

//* import the datasets
const dataStations = require('./dataset/q-stations.json');
const dataGraph = require('./dataset/q-graph.json');

//* initialise the app
const app = express();
app.use(express.json());
app.use(cors());

//* initialise the database
const usersSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/users.sqlite3',
});

//* define the database models
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
});

usersSequelize.define('HistoryEntry', {
  userToken: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  destId: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'history'
});

//* start up procedure
async function main() {
  //* start the express server
  app.listen(process.env.PORT | 1001, () => {
    console.log(`Server started on port ${process.env.PORT | 1001}`);
  });

  //* sync the database
  try {
    await usersSequelize.sync();
  }
  catch (err) {
    console.log('Could not connect to users database');
    console.log(err);
  }
}

//* handle a post request on /login
//* this endpoint is used when people log in via the client
app.post('/login', async (req, res) => {
  LoginRoute.post(req, res, usersSequelize);
});

//* handle a post request on /signup
//* this endpoint is used when people sign up via the client
app.post('/signup', async (req, res) => {
  SignupRoute.post(req, res, usersSequelize);
});

//* handle a post request on /auth
//* this endpoint is used when people authenticate via the client
app.post('/auth', async (req, res) => {
  AuthRoute.post(req, res, usersSequelize);
});

//* handle a get request on /data/stations
//* this endpoint is used to send the stations data directly from the json file
app.get('/data/stations', async (req, res) => {
  res.json(dataStations);
})

//* handle a get request on /data/graph
//* this endpoint is used to send the graph data directly from the json file
app.get('/data/graph', async (req, res) => {
  FindPathRoute.get(req, res, dataGraph);
});

//* handle a get request on /path/v2
//* this endpoint is used to find the path between two stations
app.get('/path/v2', async (req, res) => {
  FindPathRoute.get(req, res, dataStations.stations, dataGraph.graph, usersSequelize);
});

//* handle a get request on /history
//* this endpoint is used to fetch a specific user's search history 
app.get('/history', async (req, res) => {
  HistoryRoute.get(req, res, dataStations.stations, usersSequelize);
});

//* run the main function of the script
main();