import puppeteer from 'puppeteer';

async function testNintendoKRDetail3() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://store.nintendo.co.kr/games/sale', { waitUntil: 'networkidle2' });
  
  const url = await page.evaluate(() => {
    const el = document.querySelector('.product-item-link');
    return el ? (el as HTMLAnchorElement).href : null;
  });
  
  if (url) {
    console.log("Found URL:", url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    const text = await page.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 2000));
  }
  await browser.close();
}
testNintendoKRDetail3();
