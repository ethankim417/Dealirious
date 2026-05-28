import axios from 'axios';

async function testCheapSharkDeals() {
  try {
    const res = await axios.get('https://www.cheapshark.com/api/1.0/deals?storeID=25&limit=1');
    console.log(res.data[0]);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testCheapSharkDeals();
