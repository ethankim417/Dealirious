import axios from 'axios';

async function testCodeTabs() {
  try {
    const targetUrl = encodeURIComponent('https://psdeals.net/kr-store/discounts');
    const res = await axios.get(`https://api.codetabs.com/v1/proxy?quest=${targetUrl}`);
    console.log("Status:", res.status);
    console.log("Length:", res.data.length);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testCodeTabs();
