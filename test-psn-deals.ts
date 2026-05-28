import axios from 'axios';

async function testPSNDeals() {
  try {
    const res = await axios.get('http://localhost:3000/api/deals?platform=playstation');
    console.log(res.data.map((d: any) => d.name).slice(0, 20));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPSNDeals();
