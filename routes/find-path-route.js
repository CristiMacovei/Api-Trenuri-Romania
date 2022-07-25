//* the min-heap is a datastructure used for dijkstra's algorithm 
//* we import it from a module called datastructures-js
const { MinHeap } = require("@datastructures-js/heap");

//* import the validate string function from the validate-string module 
const { validate } = require('../other/validate-string');

//* the dijkstra algorithm used to find paths
function dijkstra(startId, destId, graph, startHour) {
  //* start with an empty heap and configure it to sort its nodes (stations) by time
  let heap = new MinHeap(node => node.time);

  //* time map - this works as the distance map from a classic dijkstra algorithm
  let timeMap = new Map();
  const day = 24 * 60 * 60;

  //* prev map - for each node this keeps track of its previous node
  //* this is used to reconstruct the path at the end 
  let prevMap = new Map();

  //* initialize the algorithm
  timeMap.set(startId, startHour);
  prevMap.set(startId, null);
  heap.insert({ id: startId, time: startHour });

  //* classic dijkstra with fibonacci heap 
  while (!heap.isEmpty()) {
    //* extract the current root of the heap
    const current = heap.extractRoot();

    //* if the destination has been reached, stop the algorithm
    if (current.id === destId) {
      break;
    }

    //* if the current station has been reached before with a better time, ignore it
    if (timeMap.has(current.id) && timeMap.get(current.id) < current.time) {
      continue;
    }

    //* if the current station has no graph entry, skip it 
    if (typeof graph[current.id] === 'undefined') {
      continue;
    }

    //* split the current time in days passed and remainder
    const daysPassed = Math.floor(current.time / day);
    const currentTimeOfDay = current.time % day;

    //* visit all the neigbors in the graph - part of dijkstra's algorithm
    for (let neighbor of graph[current.id]) {
      const departureTimeOfDay = neighbor.departureTime;
      const arrivalTimeOfDay = neighbor.arrivalTime;

      //* calculate final time
      let finalTime = daysPassed * day + arrivalTimeOfDay;
      if (currentTimeOfDay > departureTimeOfDay) {
        finalTime += day;
      }

      //* if it's the first time this station is reached or the final time is better than whatever was before, update its best solution
      if (!timeMap.has(neighbor.to) || finalTime < timeMap.get(neighbor.to)) {
        timeMap.set(neighbor.to, finalTime);
        prevMap.set(neighbor.to, { id: current.id, trainId: neighbor.trainId, time: current.time });
        heap.insert({ id: neighbor.to, time: finalTime });
      }
    }
  }
  //* the algorithm is done running when the heap has been completely emptied

  //* return the two maps
  return {
    timeMap,
    prevMap
  };
}

//* handle get requests on this route
async function get(req, res, stations, graph, db) {
  //* get the origin id and the dest id from the request query
  const originId = req.query.startId;
  const destId = req.query.destId;

  //* validate token and find user
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
  })

  if (user === null) {
    res.json({
      status: 'error',
      message: 'Invalid credentials'
    })

    return
  }

  //* validate ids
  const originValidation = validate(originId)
  const destValidation = validate(destId)

  if (!originValidation.valid) {
    res.json({
      'status': 'error',
      'message': `Origin is invalid, reason: ${originValidation.reason}`
    })

    return
  }

  if (!destValidation.valid) {
    res.json({
      'status': 'error',
      'message': `Origin is invalid, reason: ${originValidation.reason}`
    })

    return
  }

  //* find the hours the origin station from the dataset
  const hours = stations.filter(station => station.stationId === originId)[0]?.hours.map(hour => parseInt(hour));

  //* store the best path for each arrival hour 
  let paths = new Map();

  //* loop through starting hours
  for (let hour of hours) {
    //* find the best path for each starting hour
    const {timeMap, prevMap} = dijkstra(originId, destId, graph, hour);

    //* rebuild the path with the prev map
    const path = [];
    let current = {id: destId, trainId: null};
    while (current !== null && typeof current !== 'undefined') {
      path.push(current);
      current = prevMap.get(current.id);
    }

    //* this method builds the path in reverse order
    //* apply the Array.prototype.reverse() function to it in order to have it the right way around
    path.reverse();

    //* add details to each path entry
    for (let i = 0; i < path.length; i++) {
      const stationId = path[i].id;

      const station = stations.filter(station => station.stationId === stationId)[0];

      path[i] = {
        ...path[i],
        name: station?.stationName,
        latitude: station?.latitude,
        longitude: station?.longitude
      };
    }

    //* get the arrival time from the time map 
    const arrivalTime = timeMap.get(destId);

    //* if there is no better path with this arrival time then store the current path into the map 
    if (paths.has(arrivalTime)) {
      if (paths.get(arrivalTime).departureTime > hour) {
        paths.set(arrivalTime, {
          departureTime: hour,
          path: path
        })
      }
    }
    else {
      paths.set(arrivalTime, {
        departureTime: hour,
        path: path
      })
    }
  }

  //* flatten the paths map to a 2D array
  const pathsArr = Array.from(paths.entries()).map( ([arrivalTime, path]) => {
    return {
      arrivalTime,
      ...path
    }
  }).sort((first, second) => { //* sort the array to have the shortest paths displayed first
    return (first.arrivalTime - first.departureTime) - (second.arrivalTime - second.departureTime)
  })

  //* save history entry to database
  console.log(token)
  const entry = await db.models.HistoryEntry.create({
    userToken: token,
    originId,
    destId
  })

  await entry.save()
  
  //* send response 
  res.json({
    status: 'success',
    route: {
      startStationId: originId,
      destStationId: destId
    },
    pathsArr
  })
}

//* export the handler function
module.exports = {
  get
}
