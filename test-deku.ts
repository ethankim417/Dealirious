import axios from 'axios';
import * as cheerio from 'cheerio';

async function testDeku() {
  try {
    const res = await axios.get('https://www.dekudeals.com/hottest?filter[discount]=discounted&filter[metacritic]=80', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(res.data);
    $('.item-grid2 .item-box').slice(0, 5).each((i, el) => {
      const title = $(el).find('.name').text().trim();
      const price = $(el).find('.price').first().text().trim();
      console.log({title, price});
    });
  } catch (e: any) {
    console.error(e.message);
  }
}
testDeku();
