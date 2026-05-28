import axios from 'axios';

async function testEpicDeals() {
  try {
    const res = await axios.get('https://www.cheapshark.com/api/1.0/deals?storeID=25&onSale=1&limit=50');
    console.log(res.data.map((d: any) => d.title).slice(0, 20));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testEpicDeals();
