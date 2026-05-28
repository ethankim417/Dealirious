import axios from 'axios';
import * as cheerio from 'cheerio';

async function testPSDeals() {
  try {
    const res = await axios.get('https://psdeals.net/kr-store/discounts', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    const $ = cheerio.load(res.data);
    console.log("PSDeals Items:", $('.game-collection-item').length);
    if ($('.game-collection-item').length > 0) {
      console.log($('.game-collection-item').first().find('.game-collection-item-details-title').text().trim());
    }
  } catch (e: any) {
    console.log("PSDeals Failed:", e.message);
  }
}
testPSDeals();
