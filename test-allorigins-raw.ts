import * as cheerio from 'cheerio';

async function testAllOriginsRaw() {
  try {
    const targetUrl = encodeURIComponent('https://psdeals.net/kr-store/discounts');
    const res = await fetch(`https://api.allorigins.win/raw?url=${targetUrl}`);
    const text = await res.text();
    const $ = cheerio.load(text);
    console.log("Items:", $('.game-collection-item').length);
    if ($('.game-collection-item').length > 0) {
      console.log($('.game-collection-item').first().html());
    } else {
      console.log(text.substring(0, 500));
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testAllOriginsRaw();
