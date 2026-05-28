import axios from 'axios';
import * as cheerio from 'cheerio';

async function testPlatPrices() {
  try {
    const res = await axios.get('https://platprices.com/ps5/discounts', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    console.log("Items:", $('.game-container').length);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPlatPrices();
