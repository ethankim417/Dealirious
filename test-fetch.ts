import * as cheerio from 'cheerio';

async function testFetch() {
  try {
    const res = await fetch('https://psdeals.net/kr-store/discounts', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const text = await res.text();
    const $ = cheerio.load(text);
    console.log("Status:", res.status);
    console.log("Items:", $('.game-collection-item').length);
  } catch (e: any) {
    console.log("Fetch Failed:", e.message);
  }
}
testFetch();
