import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function testNintendoKRProductsDetail() {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://store.nintendo.co.kr/games/sale', { waitUntil: 'networkidle2' });
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const items = $('.product-item').toArray();
    
    items.slice(0, 3).forEach(el => {
      const title = $(el).find('.product-item-link').text().trim();
      const url = $(el).find('.product-item-link').attr('href');
      const image = $(el).find('.product-image-photo').attr('src');
      
      const specialPrice = $(el).find('.special-price .price').text().trim();
      const oldPrice = $(el).find('.old-price .price').text().trim();
      
      console.log({ title, url, image, specialPrice, oldPrice });
    });
    
    await browser.close();
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testNintendoKRProductsDetail();
