import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function testPuppeteerDeals() {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://store.playstation.com/ko-kr/pages/deals', { waitUntil: 'networkidle2' });
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Find all links to categories
    const links = $('a[href^="/ko-kr/category/"]').toArray();
    console.log("Category links:", links.length);
    links.slice(0, 5).forEach(el => {
      console.log($(el).attr('href'), $(el).text().trim());
    });
    
    await browser.close();
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPuppeteerDeals();
