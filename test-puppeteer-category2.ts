import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function testPuppeteerCategory() {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://store.playstation.com/ko-kr/category/3f772501-f6f8-49b7-abac-874a88ca4897/1', { waitUntil: 'networkidle2' });
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const items = $('li').toArray();
    
    let deals: any[] = [];
    items.forEach(el => {
      const title = $(el).find('[data-qa="psw-product-tile__title"]').text().trim() || $(el).find('.psw-t-body').text().trim();
      const priceText = $(el).text();
      
      if (title && priceText.includes('원')) {
        // The price structure is usually:
        // Original price with strikethrough: <s>10,000원</s>
        // Sale price: <span class="psw-m-r-3">5,000원</span>
        // Let's extract them
        const originalPriceStr = $(el).find('s').text().trim();
        const salePriceStr = $(el).find('.psw-m-r-3').text().trim() || $(el).find('.psw-c-t-2').text().trim();
        
        if (originalPriceStr && salePriceStr) {
          deals.push({
            title,
            originalPrice: originalPriceStr,
            salePrice: salePriceStr
          });
        }
      }
    });
    
    console.log("Found deals:", deals.length);
    console.log(deals.slice(0, 5));
    
    await browser.close();
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPuppeteerCategory();
