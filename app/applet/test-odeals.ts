import axios from 'axios';
import * as cheerio from 'cheerio';
async function run() {
  try {
    const res = await axios.get('https://odeals.net/platform/quest/discount', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    const deals: any[] = [];
    $('.col-game').each((i, el) => {
      if (i >= 5) return;
      const title = $(el).find('a').attr('title')?.trim();
      const price = $(el).find('.text-success').first().text().trim();
      const originalPrice = $(el).find('del').first().text().trim();
      const link = $(el).find('a').attr('href');
      const bg = $(el).find('.position-relative').attr('style') || '';
      const imgMatch = bg.match(/url\(['"]?(.*?)['"]?\)/);
      deals.push({title, price, originalPrice, link, img: imgMatch ? imgMatch[1] : null});
    });
    console.log(deals);
  } catch(e) { console.log(e.response ? e.response.status : e.message); }
}
run();
