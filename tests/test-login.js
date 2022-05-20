const axios = require('axios')

axios.post('http://localhost:1001/login', {
  username: 'test',
  password: 'test'
})
.then(res => {
  console.log(res.data)
})