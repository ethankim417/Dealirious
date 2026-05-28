import axios from 'axios';
import * as cheerio from 'cheerio';

async function testRuliweb() {
  try {
    const res = await axios.get('https://bbs.ruliweb.com/market/board/1020', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    $('.table_body').slice(0, 10).each((i, el) => {
      const category = $(el).find('.divsn').text().trim();
      const title = $(el).find('.subject a.deco').text().trim();
      console.log(`[${category}] ${title}`);
    });
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testRuliweb();
