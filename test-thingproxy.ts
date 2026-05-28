import axios from 'axios';

async function testThingProxy() {
  try {
    const targetUrl = 'https://psdeals.net/kr-store/discounts';
    const res = await axios.get(`https://thingproxy.freeboard.io/fetch/${targetUrl}`);
    console.log("Status:", res.status);
    console.log("Length:", res.data.length);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testThingProxy();
