import axios from 'axios';

async function testDekuDealsRss() {
  try {
    const rssUrl = encodeURIComponent('https://www.dekudeals.com/recent-drops.rss');
    const res = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
    console.log("Status:", res.status);
    console.log("Items:", res.data.items?.length);
    if (res.data.items?.length > 0) {
      console.log(res.data.items[0].title);
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testDekuDealsRss();
