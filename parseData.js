const xml = require('xml-js')
const fs = require('fs/promises')
const axios = require('axios')

function compressName(string) {
  return string.toLowerCase().replaceAll(' ', '').replaceAll('.', '').replaceAll('â', 'a').replaceAll('ă', 'a').replaceAll('î', 'i').replaceAll('ș', 's').replaceAll('ş', 's').replaceAll('ț', 't').replaceAll('ţ', 't');
}

async function getCoordinates(name, manualData) {
  const compressedName = compressName(name);

  //* first search in the manual data
  const match = manualData.filter(item => item.name === compressedName);
  if (match.length > 0) {
    return match[0];
  }

  //* if nothing is found, try the other api 
  const specialCharactersReplaced = name.toLowerCase().replaceAll('â', 'a').replaceAll('ă', 'a').replaceAll('î', 'i').replaceAll('ș', 's').replaceAll('ş', 's').replaceAll('ț', 't').replaceAll('ţ', 't');
  const apiResponse = await axios.get(`https://nominatim.openstreetmap.org/search.php?q=${specialCharactersReplaced}&format=jsonv2`);

  if (apiResponse.data.length === 0) {
    return null;
  }

  const {lat, lon} = apiResponse.data[0];

  return {
    latitude: parseFloat(lat),
    longitude: parseFloat(lon)
  };
}

fs.readFile('./dataset/trains.xml', 'utf-8')
.then(async data => {
  const json = xml.xml2json(data, {compact: true, spaces: 2})

  const object = JSON.parse(json)

  const trains = object['XmlIf']['XmlMts']['Mt']['Trenuri']['Tren']

  //? fill stations
  console.log('Parsing stations...')
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

  const stations = Array.from(trainStations.entries()).map(([id, {name, hours}]) => {
    return {
      stationId: id, 
      stationName: name,
      hours: Array.from(hours)
    }
  });

  //? add coordinates

  //? get the manual data
  console.log('Fetching manual data...')
  const manualDataResponse = await axios.get('https://api.coop.trenuri-romania.cristimacovei.dev/fetch');
  const manualData = manualDataResponse.data.json;

  console.log('Processing coordinates...')
  let startTime = new Date().getTime();
  for (let i = 0; i < stations.length; i++) {
    try {
      const station = stations[i]
      const coords = await getCoordinates(station.stationName, manualData)

      if (i % 10 === 0) {
        console.log(`${((new Date().getTime() - startTime) / 1000).toFixed(2)}s elapsed - Progress: ${(100 * i / stations.length).toFixed(2)}% (${i} out of ${stations.length})`)
      }

      if (coords !== null) {
        stations[i] = {
          ...station,
          latitude: coords.latitude,
          longitude: coords.longitude
        }
      }
    }
    catch (e) {
      console.log(`Blew up @ ${stations[i].stationName}`);
    }
  }

  fs.writeFile('./dataset/q-stations.json', JSON.stringify({ stations }, null, 3))

  .then(() => { console.log('Stations written to /dataset/q-stations.json\n') })

  
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
        trainId: train['_attributes']['CategorieTren'] + train['_attributes']['Numar'],
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
