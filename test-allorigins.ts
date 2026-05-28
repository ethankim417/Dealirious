import axios from 'axios';
import * as cheerio from 'cheerio';

async function testAllOrigins() {
  try {
    const targetUrl = encodeURIComponent('https://psprices.com/region-kr/discounts/?sort=metacritic&platform=PS5');
    const res = await axios.get(`https://api.allorigins.win/get?url=${targetUrl}`);
    const $ = cheerio.load(res.data.contents);
    console.log("PSPrices via AllOrigins Items:", $('.component--game-card').length);
    if ($('.component--game-card').length > 0) {
      console.log($('.component--game-card').first().find('.component--game-card__title').text().trim());
    }
  } catch (e: any) {
    console.log("AllOrigins Failed:", e.message);
  }
}
testAllOrigins();
