import axios from 'axios';
import * as cheerio from 'cheerio';

async function testGgDeals() {
  try {
    const res = await axios.get('https://gg.deals/deals/playstation/playstation-store-deals/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const $ = cheerio.load(res.data);
    console.log("Items:", $('.game-box').length);
    $('.game-box').slice(0, 3).each((i, el) => {
      const title = $(el).find('.game-info-title').text().trim();
      const price = $(el).find('.price-inner').text().trim();
      console.log(title, price);
    });
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testGgDeals();
