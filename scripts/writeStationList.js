const { stations } = require('../dataset/q-stations.json');
const fs = require('fs/promises');

function compressName(string) {
  return string.toLowerCase().replaceAll('.', '').replaceAll('â', 'a').replaceAll('ă', 'a').replaceAll('î', 'i').replaceAll('ș', 's').replaceAll('ş', 's').replaceAll('ț', 't').replaceAll('ţ', 't');
}

const names = stations.map(station => compressName(station.stationName)).join('\n');

fs.writeFile('script-outputs/station-list.txt', names, 'utf8')
.then(() => console.log('done'));