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

    stations.forEach(station => {
      if (!trainStations.has(station['_attributes']['CodStaOrigine'])) {
        trainStations.set(
          station['_attributes']['CodStaOrigine'],
          {
            name: station['_attributes']['DenStaOrigine'],
            hours: new Set()
          }
        )
      }
      trainStations.get(station['_attributes']['CodStaOrigine']).hours.add(station['_attributes']['OraP'])

      if (!trainStations.has(station['_attributes']['CodStaDest'])) {
        trainStations.set(
          station['_attributes']['CodStaDest'],
          {
            name: station['_attributes']['DenStaDestinatie'],
            hours: new Set()
          }
        )
      }
      trainStations.get(station['_attributes']['CodStaDest']).hours.add(station['_attributes']['OraS'])
    })
  })

  fs.writeFile('./dataset/q-stations.json', JSON.stringify({
    stations: Array.from(trainStations.entries()).map(([id, {name, hours}]) => {
      return {
        stationId: id, 
        stationName: name,
        hours: Array.from(hours)
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


      const departureTime = parseInt(station['_attributes']['OraP'])
      const arrivalTime = parseInt(station['_attributes']['OraS'])

      if (destId === originId) {
        return
      }

      if (!graph.has(originId)) {
        graph.set(originId, [])
      }

      graph.get(originId).push({
        trainId: train['_attributes']['Numar'],
        to: destId,
        departureTime, arrivalTime
      })
    })
  })

  fs.writeFile('./dataset/q-graph.json', JSON.stringify({
    graph: Object.fromEntries(graph)
  }, null, 3))
  .then(() => { console.log('Graph written to /dataset/q-graph.json') })
})
