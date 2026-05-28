import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function testPuppeteerCategory() {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://store.playstation.com/ko-kr/category/3f772501-f6f8-49b7-abac-874a88ca4897/1', { waitUntil: 'networkidle2' });
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log("Title:", await page.title());
    
    // Find all list items
    const items = $('li').toArray();
    console.log("Total li elements:", items.length);
    
    let found = 0;
    items.forEach(el => {
      const title = $(el).find('[data-qa="psw-product-tile__title"]').text().trim() || $(el).find('.psw-t-body').text().trim();
      const price = $(el).find('.psw-m-r-3').text().trim() || $(el).find('s').text().trim() || $(el).find('.psw-c-t-2').text().trim();
      
      if (title && title.length > 0 && $(el).text().includes('원')) {
        console.log(title, $(el).text().replace(/\s+/g, ' ').substring(0, 50));
        found++;
      }
    });
    
    console.log("Found items:", found);
    
    await browser.close();
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPuppeteerCategory();
