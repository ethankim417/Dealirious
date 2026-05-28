import axios from 'axios';
import * as cheerio from 'cheerio';

async function testCorsProxy() {
  try {
    const targetUrl = encodeURIComponent('https://psprices.com/region-kr/discounts/?sort=metacritic&platform=PS5');
    const res = await axios.get(`https://corsproxy.io/?${targetUrl}`);
    const $ = cheerio.load(res.data);
    console.log("PSPrices via CorsProxy Items:", $('.component--game-card').length);
  } catch (e: any) {
    console.log("CorsProxy Failed:", e.message);
  }
}
testCorsProxy();
