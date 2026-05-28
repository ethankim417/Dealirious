const axios = require('axios');
axios.get('http://localhost:3000/api/search?q=cyberpunk')
  .then(res => console.log(res.data))
  .catch(console.error);
