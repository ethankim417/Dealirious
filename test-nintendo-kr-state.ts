import axios from 'axios';
import * as cheerio from 'cheerio';

async function testNintendoKR() {
  try {
    const res = await axios.get('https://store.nintendo.co.kr/games/sale', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    
    // Check for common state objects
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const content = $(script).html() || '';
      if (content.includes('window.__INITIAL_STATE__') || content.includes('__NEXT_DATA__') || content.includes('apolloState')) {
        console.log("Found state script of length:", content.length);
        console.log(content.substring(0, 200));
      }
    }
    
    // Check HTML elements
    const items = $('.category-product-item').toArray();
    console.log("Found items via class:", items.length);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testNintendoKR();
