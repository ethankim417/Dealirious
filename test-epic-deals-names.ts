import axios from 'axios';

async function testEpicDeals() {
  try {
    const res = await axios.get('http://localhost:3000/api/deals?platform=epic');
    console.log(res.data.map((d: any) => d.name));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testEpicDeals();
