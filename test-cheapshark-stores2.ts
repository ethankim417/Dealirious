import axios from 'axios';

async function testStores() {
  try {
    const res = await axios.get('https://www.cheapshark.com/api/1.0/stores');
    console.log(res.data.filter((s: any) => s.storeName.toLowerCase().includes('playstation') || s.storeName.toLowerCase().includes('sony')));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testStores();
