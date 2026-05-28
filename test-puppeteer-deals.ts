import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function testPuppeteerDeals() {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://store.playstation.com/ko-kr/pages/deals', { waitUntil: 'networkidle2' });
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log("Title:", await page.title());
    
    // Let's find game items
    const items = $('li[data-qa^="ems-sdk-grid#productTile"]').toArray();
    console.log("Items found:", items.length);
    
    if (items.length === 0) {
      // Try another selector
      const items2 = $('[data-qa="ems-sdk-grid#productTile"]').toArray();
      console.log("Items2 found:", items2.length);
      
      if (items2.length > 0) {
        items2.slice(0, 5).forEach(el => {
          const title = $(el).find('[data-qa="psw-product-tile__title"]').text().trim();
          const price = $(el).find('[data-qa="psw-product-tile__price"]').text().trim();
          console.log(title, price);
        });
      }
    } else {
      items.slice(0, 5).forEach(el => {
        const title = $(el).find('[data-qa="psw-product-tile__title"]').text().trim();
        const price = $(el).find('[data-qa="psw-product-tile__price"]').text().trim();
        console.log(title, price);
      });
    }
    
    await browser.close();
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPuppeteerDeals();
