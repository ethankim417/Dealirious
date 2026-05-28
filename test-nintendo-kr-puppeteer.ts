import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function testNintendoKRPuppeteer() {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://store.nintendo.co.kr/games/sale', { waitUntil: 'networkidle2' });
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log("Title:", await page.title());
    
    // Let's find game items
    const items = $('.category-product-item').toArray();
    console.log("Items found (.category-product-item):", items.length);
    
    if (items.length === 0) {
      // Try finding any product link
      const links = $('a[href*="/games/"]').toArray();
      console.log("Links to games:", links.length);
      if (links.length > 0) {
        console.log("Sample links:");
        links.slice(0, 5).forEach(link => console.log($(link).attr('href')));
      }
    } else {
      items.slice(0, 5).forEach(el => {
        const title = $(el).find('.product-item-name').text().trim();
        const price = $(el).find('.price').text().trim();
        console.log(title, price);
      });
    }
    
    await browser.close();
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testNintendoKRPuppeteer();
