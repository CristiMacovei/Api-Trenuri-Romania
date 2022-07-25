// xml-js is a library used to convert the xml dataset to json form 
const xml = require('xml-js');

// we used the promise-based version of the default node filesystem library
const fs = require('fs/promises');

// axios is required for sending requests to other APIs 
const axios = require('axios');

//* function for compressing a string, mainly used for compressing station names
function compressName(string) {
  return string 
    .toLowerCase() //* lowercase the string
    .replaceAll(' ', '') //* remove all spaces
    .replaceAll('.', '') //* remove all dots ( we have numerous stations containing dots )
    .replaceAll('â', 'a').replaceAll('ă', 'a').replaceAll('î', 'i').replaceAll('ș', 's').replaceAll('ş', 's').replaceAll('ț', 't').replaceAll('ţ', 't'); //* replace all special characters 
}

//* function to fetch the coordinates of a station
//* manual data doesn't need to be fetched, it's already passed as a parameter
async function getCoordinates(name, manualData) {
  //* compress the name 
  const compressedName = compressName(name);

  //* first search in the manual data
  const matches = manualData.filter(item => item.name === compressedName);

  //* if there's any match, return it
  if (matches.length > 0) {
    return matches[0];
  }

  //* if nothing is found, try the other api 
  const specialCharactersReplaced = name.toLowerCase().replaceAll('â', 'a').replaceAll('ă', 'a').replaceAll('î', 'i').replaceAll('ș', 's').replaceAll('ş', 's').replaceAll('ț', 't').replaceAll('ţ', 't');
  const apiResponse = await axios.get(`https://nominatim.openstreetmap.org/search.php?q=${specialCharactersReplaced}&format=jsonv2`);

  //* if nothing is found there either, return null
  if (apiResponse.data.length === 0) {
    return null;
  }

  //* if it found something, parse the response and return it 
  const {lat, lon} = apiResponse.data[0];

  return {
    latitude: parseFloat(lat),
    longitude: parseFloat(lon)
  };
}

async function main() {
  console.log('[0 / 5] Starting data parsing sequence...');

  //* read the xml dataset
  let data = null;
  try {
    console.log('[1 / 5] Reading xml dataset...');
    data = await fs.readFile('./dataset/trains.xml', 'utf-8');
    console.log('[1 / 5] Successfully read xml dataset');
  } 
  catch (e) { //* catch any possible errors that might arise at this step 
    console.log(`[1 / 5] Encountered ${e.message} whilst reading the dataset. Please try again.`);

    return;
  }

  //* convert the xml data to json
  let json = null;
  try {
    console.log('[2 / 5] Converting to JSON...');
    json = JSON.parse(xml.xml2json(data, {compact: true, spaces: 2}));
    console.log('[2 / 5] Successfully converted to JSON')
  }
  catch (e) { //* catch any possible errors that might arise at this step 
    console.log(`[2 / 5] Encountered ${e.message} whilst parsing the dataset. Please try again.`);

    return;
  }

  //* fetch all train entries from the entire object
  let trains = null;
  try {
    console.log('[3 / 5] Fetching train data...');
    trains = json['XmlIf']['XmlMts']['Mt']['Trenuri']['Tren'];
    console.log('[3 / 5] Successfully fetched train data.')
  }
  catch (e) { //* catch any possible errors that might arise at this step 
    console.log(`[3 / 5] Encountered ${e.message} whilst fetching train data. Please try again`);

    return;
  }

  //* fill stations object
  /**
    file structure: 
    {
      stations: [
        {
          id: '<id>',
          name: '<name>',
          lat: '<latitude>',
          lon: '<longitude>',
          hours: [
            '<hour1>',
            '<hour2>',
            etc
          ]
        }
      ]
    }
  */
  console.log('[4 / 5] Processing stations.json...');
  
  //* start out with an empty map
  const trainStations = new Map()

  //* for each train get all the stations it goes through
  trains.forEach(train => {
    const stations = train['Trase']['Trasa']['ElementTrasa'];

    //* loop through the stations found
    stations.forEach(station => {
      //* if it's not already in the map, add it with an empty set of hours
      if (!trainStations.has(station['_attributes']['CodStaOrigine'])) {
        trainStations.set(
          station['_attributes']['CodStaOrigine'],
          {
            name: station['_attributes']['DenStaOrigine'],
            hours: new Set()
          }
        )
      }

      //* add the current hour to the set found in the map
      trainStations.get(station['_attributes']['CodStaOrigine']).hours.add(station['_attributes']['OraP'])

      //* repeat the same process for the destination station, not just for the origin
      //* this approach does create a few duplicates, but they are handled by the javascript Set datastructure 
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
    });
  });

  //* flatten the map into a 2D array
  const stations = Array.from(trainStations.entries()).map(([id, {name, hours}]) => {
    return {
      stationId: id, 
      stationName: name,
      hours: Array.from(hours)
    }
  });

  //* add the coordinates for each station
  console.log('[4 / 5] Finding station coordinates...');

  //* fetch manual data
  let manualData = null;
  try { 
    console.log('[4 / 5] Fetching manual data...');
    const manualDataResponse = await axios.get('https://api.coop.trenuri-romania.cristimacovei.dev/fetch');
    manualData = manualDataResponse.data.json;
    console.log('[4 / 5] Manual data fetched successfully.');
  }
  catch (e) { //* catch any possible errors that might arise at this step 
    console.log(`[4 / 5] Encountered ${e.message} whilst fetching manual coordinates data. Please try again`);

    return;
  }

  //* get the coordinates
  console.log('[4 / 5] Processing coordinates... (This should take approximatively 10-15 mins)');

  //* mark the start time in order to display the elapsed time every 20 steps
  let startTime = new Date().getTime();
  for (let i = 0; i < stations.length; i++) {
    try {
      const station = stations[i]
      const coords = await getCoordinates(station.stationName, manualData)

      //* every 20 steps, display a progress update
      if (i % 20 === 0) {
        console.log(`[4 / 5] ${((new Date().getTime() - startTime) / 1000).toFixed(2)}s elapsed - Progress: ${(100 * i / stations.length).toFixed(2)}% (${i} out of ${stations.length})`)
      }

      if (coords !== null) {
        //* add coordinates data to the stations
        stations[i] = {
          ...station,
          latitude: coords.latitude,
          longitude: coords.longitude
        }
      }
    }
    catch (e) {
      console.log(`Encountered an error with the station '${stations[i].stationName}'`);
    }
  }

  //* write the newly-processed data to the target file
  try {
    console.log('[4 / 5] Writing file...');
    await fs.writeFile('./dataset/q-stations.json', JSON.stringify({ stations }, null, 3));
    console.log('[4 / 5] Successfully written data to stations.json');
  }
  catch (e) { //* catch any possible errors that might arise at this step 
    console.log(`[4 / 5] Encountered ${e.message} whilst writing data to stations.json. Please try again`);

    return;
  }

  //* create the graph
  console.log('[5 / 5] Processing graph.json...');


  //* start out with an empty map
  const graph = new Map();
  
  try {
    //* for each train get all the stations it goes through
    trains.forEach(train => {
      const stations = train['Trase']['Trasa']['ElementTrasa'];

      //* loop through all the stations
      stations.forEach(station => {
        const originId = station['_attributes']['CodStaOrigine'];
        const destId = station['_attributes']['CodStaDest'];

        //* departure and arrival time for each station are present in the dataset
        const departureTime = parseInt(station['_attributes']['OraP']);
        const arrivalTime = parseInt(station['_attributes']['OraS']);

        if (destId === originId) {
          //* if the dest and origin are the same, ignore this entry
          //* adding these entries will create cycles in the graph and will result in the algorithm performing worse
          return;
        }

        //* if the origin is not yet present in the map, add it with an empty array
        if (!graph.has(originId)) {
          graph.set(originId, []);
        }

        //* add a path from the origin station to the destination station
        graph.get(originId).push({
          trainId: train['_attributes']['CategorieTren'] + train['_attributes']['Numar'],
          to: destId,
          departureTime, arrivalTime
        });
      });
    });
  }
  catch (e) { //* catch any possible errors that might arise at this step 
    console.log(`[5 / 5] Encountered ${e.message} whilst building the graph. Please try again.`);

    return;
  }
  
  //* write the newly-processed datd to the target file 
  try {
    console.log('[5 / 5] Writing data to graph.json');

    await fs.writeFile('./dataset/q-graph.json', JSON.stringify({
      graph: Object.fromEntries(graph)
    }, null, 3));

    console.log('Successfully written data to graph.json');
  } catch (e) { //* catch any possible errors that might arise at this step 
    console.log(`[5 / 5] Encountered ${e.message} whilst building the graph. Please try again.`);

    return;
  }

  console.log('Data parsing completed. You can now safely start the server');
}

main();