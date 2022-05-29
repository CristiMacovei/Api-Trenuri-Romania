const { MinHeap } = require("@datastructures-js/heap")

function dijkstra(startId, destId, graph) {
  let heap = new MinHeap(node => node.dist)

  //? dist map
  let dist = new Map()

  //? prev map
  let prev = new Map()


  dist.set(startId, 0);
  prev.set(startId, null)
  heap.insert({ id: startId, dist: 0 });

  while (!heap.isEmpty()) {
    const current = heap.extractRoot();
    console.log(`head is @ ${current.id}`)

    if (current.id === destId) {
      break;
    }

    if (dist.has(current.id) && dist.get(current.id) < current.dist) {
      continue;
    }

    if (typeof graph[current.id] === 'undefined') {
      continue;
    }

    for (let neighbor of graph[current.id]) {
      const newDist = current.dist + neighbor.time;

      if (!dist.has(neighbor.to) || newDist < dist.get(neighbor.to)) {
        dist.set(neighbor.to, newDist)
        prev.set(neighbor.to, { id: current.id, trainId: neighbor.trainId })
        heap.insert({ id: neighbor.to, dist: newDist })
      }
    }
  }

  return {
    dist,
    prev
  };
}

async function get(req, res, graph) {
  const originId = req.query.startId
  const destId = req.query.destId

  const {dist, prev} = dijkstra(originId, destId, graph)

  const path = []
  let current = {id: destId, trainId: null}
  while (current !== null) {
    path.push(current)
    current = prev.get(current.id)
  }
  
  res.json({
    status: 'success',
    route: {
      startStationId: originId,
      destStationId: destId,
    },
    // graph,
    nigger: dist.get(destId),
    path
  })
}

module.exports = {
  get
}