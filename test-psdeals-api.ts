import axios from 'axios';

async function testPSDealsAPI() {
  try {
    const res = await axios.get('https://psdeals.net/api/v1/discounts?region=kr');
    console.log("Status:", res.status);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPSDealsAPI();
