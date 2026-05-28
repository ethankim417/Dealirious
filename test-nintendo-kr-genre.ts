import puppeteer from 'puppeteer';

async function testNintendoKRDetail() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://store.nintendo.co.kr/70010000000185', { waitUntil: 'networkidle2' });
  
  const genres = await page.evaluate(() => {
    const genreElements = Array.from(document.querySelectorAll('.product-attribute.genre .value'));
    return genreElements.map(el => el.textContent?.trim());
  });
  
  console.log("Genres:", genres);
  await browser.close();
}
testNintendoKRDetail();
