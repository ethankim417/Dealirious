const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const dealsRes = await axios.get(`https://store.playstation.com/en-us/pages/deals`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $deals = cheerio.load(dealsRes.data);
    const nextDataStr = $deals('#__NEXT_DATA__').text();
    const nextData = JSON.parse(nextDataStr);
    const apolloState = nextData.props?.apolloState;
    console.log(Object.keys(apolloState));
  } catch (error) {
    console.error(error.message);
  }
}
test();
