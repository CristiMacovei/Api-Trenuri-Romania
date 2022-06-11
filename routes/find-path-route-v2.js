//? heap is a datastructure used for dijkstra's algorithm 
const { MinHeap } = require("@datastructures-js/heap")

//? used to validate strings to make sure we don't receive requests with empty parameters 
const { validate } = require('../other/validate-string')

function dijkstra(startId, destId, graph, startHour) {
  let heap = new MinHeap(node => node.time)

  //? time map
  let timeMap = new Map()
  const day = 24 * 60 * 60

  //? prev map
  let prevMap = new Map()

  timeMap.set(startId, startHour);
  prevMap.set(startId, null)
  heap.insert({ id: startId, time: startHour });

  while (!heap.isEmpty()) {
    const current = heap.extractRoot();
    // console.log(`head is @ ${current.id}, with time ${current.time}`)

    if (current.id === destId) {
      break;
    }

    if (timeMap.has(current.id) && timeMap.get(current.id) < current.time) {
      continue;
    }

    if (typeof graph[current.id] === 'undefined') {
      continue;
    }

    const daysPassed = Math.floor(current.time / day)
    const currentTimeOfDay = current.time % day;

    for (let neighbor of graph[current.id]) {
      const departureTimeOfDay = neighbor.departureTime;
      const arrivalTimeOfDay = neighbor.arrivalTime;

      let finalTime = daysPassed * day + arrivalTimeOfDay;
      if (currentTimeOfDay > departureTimeOfDay) {
        finalTime += day
      }

      if (!timeMap.has(neighbor.to) || finalTime < timeMap.get(neighbor.to)) {
        timeMap.set(neighbor.to, finalTime)
        prevMap.set(neighbor.to, { id: current.id, trainId: neighbor.trainId, time: current.time })
        heap.insert({ id: neighbor.to, time: finalTime })

        // console.log(`from ${current.id}@${current.time} to ${neighbor.to}@${finalTime}`)
      }
    }
  }

  return {
    timeMap,
    prevMap
  };
}

async function get(req, res, stations, graph, db) {
  const originId = req.query.startId
  const destId = req.query.destId

  console.log(req.headers)

  //? validate token
  const token = req.headers.authorization
  console.log(token)

  const tokenValidation = validate(token)
  if (!tokenValidation.valid) {
    res.json({
      status: 'error',
      message: `Token is invalid, reason: ${tokenValidation.reason}`
    })

    return
  }

  const user = await db.models.User.findOne({
    token
  })

  if (user === null) {
    res.json({
      status: 'error',
      message: 'Invalid credentials'
    })

    return
  }

  //? validate ids
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

  const hours = stations.filter(station => station.stationId === originId)[0]?.hours.map(hour => parseInt(hour))

  //? maps arrival time to best path 
  let paths = new Map()

  for (let hour of hours) {
    const {timeMap, prevMap} = dijkstra(originId, destId, graph, hour)

    const path = []
    let current = {id: destId, trainId: null}
    while (current !== null && typeof current !== 'undefined') {
      path.push(current)
      current = prevMap.get(current.id)
    }

    const arrivalTime = timeMap.get(destId)
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

  const pathsArr = Array.from(paths.entries()).map( ([arrivalTime, path]) => {
    return {
      arrivalTime,
      ...path
    }
  }).sort((nigger1, nigger2) => {
    return (nigger1.arrivalTime - nigger1.departureTime) - (nigger2.arrivalTime - nigger2.departureTime)
  })

  //? add history entry to db 
  console.log(token)
  const entry = await db.models.HistoryEntry.create({
    userToken: token,
    originId,
    destId
  })

  await entry.save()
  
  //? send response 
  res.json({
    status: 'success',
    route: {
      startStationId: originId,
      destStationId: destId
    },
    pathsArr
  })
}

module.exports = {
  get
}