const axios = require('axios');
async function test() {
   const res = await axios.get("https://www.cheapshark.com/api/1.0/deals?storeID=33&onSale=1&pageNumber=0");
   console.dir(res.data[0], {depth: null});
}
test();
