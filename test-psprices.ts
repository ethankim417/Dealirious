import axios from 'axios';
import * as cheerio from 'cheerio';

async function testPSPrices() {
  try {
    const res = await axios.get('https://psprices.com/region-kr/discounts/?sort=metacritic&platform=PS5', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(res.data);
    $('.component--game-card').slice(0, 5).each((i, el) => {
      const title = $(el).find('.component--game-card__title').text().trim();
      console.log({title});
    });
  } catch (e: any) {
    console.error(e.message);
  }
}
testPSPrices();
