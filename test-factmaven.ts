import axios from 'axios';

async function testFactMaven() {
  try {
    const rssUrl = encodeURIComponent('https://psprices.com/region-us/rss/?platform=PS5');
    const res = await axios.get(`https://api.factmaven.com/xml-to-json/?xml=${rssUrl}`);
    console.log("Status:", res.status);
    console.log("Keys:", Object.keys(res.data));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testFactMaven();
