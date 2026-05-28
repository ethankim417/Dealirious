import axios from 'axios';

async function testStores() {
  try {
    const res = await axios.get('https://www.cheapshark.com/api/1.0/stores');
    console.log(res.data.filter((s: any) => s.storeID === '24' || s.storeID === '25' || s.storeID === '26'));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testStores();
