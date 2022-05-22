const xml = require('xml-js')
const fs = require('fs/promises')

fs.readFile('./dataset/trains.xml', 'utf-8')
.then(data => {
  const json = xml.xml2json(data, {compact: true, spaces: 2})

  const object = JSON.parse(json)

  const trains = object['XmlIf']['XmlMts']['Mt']['Trenuri']['Tren']

  //? fill stations
  const trainStations = new Map()
  trains.forEach(train => {
    const stations = train['Trase']['Trasa']['ElementTrasa']

    trainStations.set(
      stations[0]['_attributes']['CodStaOrigine'],
      stations[0]['_attributes']['DenStaOrigine']
    )

    stations.forEach(station => {
      trainStations.set(
        station['_attributes']['CodStaDest'],
        station['_attributes']['DenStaDestinatie']
      )
    })
  })

  fs.writeFile('./dataset/q-stations.json', JSON.stringify({
    stations: Array.from(trainStations.entries()).map(([id, name]) => {
      return {
        stationId: id, stationName: name
      }
    })
  }, null, 3))
  .then(() => { console.log('Stations written to /dataset/q-stations.json') })

  
  //? fill graph
  const graph = new Map()
  trains.forEach(train => {
    const stations = train['Trase']['Trasa']['ElementTrasa']

    stations.forEach(station => {
      const originId = station['_attributes']['CodStaOrigine']
      const destId = station['_attributes']['CodStaDest']

      if (!graph.has(originId)) {
        graph.set(originId, [])
      }

      graph.get(originId).push({
        trainId: train['_attributes']['Numar'],
        to: destId
      })
    })
  })

  fs.writeFile('./dataset/q-graph.json', JSON.stringify({
    graph: Array.from(graph.entries())
  }, null, 3))
  .then(() => { console.log('Graph written to /dataset/q-graph.json') })
})
