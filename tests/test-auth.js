const axios = require('axios')

axios.post('http://localhost:1001/auth', {
  token: 'a8e465e697c8bcd6ac752da0a037ab5bf63d2638d5bcf7c85840a9f2b8b54a25'
})
.then(res => {
  console.log(res.data)
})