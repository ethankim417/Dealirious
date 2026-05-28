import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function testNintendoKRProducts() {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://store.nintendo.co.kr/games/sale', { waitUntil: 'networkidle2' });
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const items = $('.product-item').toArray();
    console.log("Found .product-item:", items.length);
    
    if (items.length > 0) {
      items.slice(0, 5).forEach(el => {
        const title = $(el).find('.product-item-link').text().trim();
        const price = $(el).find('.price').text().trim();
        console.log(title, price);
      });
    } else {
      console.log("No .product-item found. Let's look at all links with 'price' in them.");
      const priceEls = $('.price').toArray();
      console.log("Found .price elements:", priceEls.length);
    }
    
    await browser.close();
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testNintendoKRProducts();
