import * as cheerio from 'cheerio';

async function testGgDealsAllOrigins() {
  try {
    const targetUrl = encodeURIComponent('https://gg.deals/deals/playstation/new-deals/');
    const res = await fetch(`https://api.allorigins.win/raw?url=${targetUrl}`);
    const text = await res.text();
    const $ = cheerio.load(text);
    console.log("Items:", $('.game-box').length);
    if ($('.game-box').length > 0) {
      $('.game-box').slice(0, 3).each((i, el) => {
        const title = $(el).find('.game-info-title').text().trim();
        const price = $(el).find('.price-inner').text().trim();
        console.log(title, price);
      });
    } else {
      console.log(text.substring(0, 500));
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testGgDealsAllOrigins();
