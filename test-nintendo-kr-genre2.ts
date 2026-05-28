import puppeteer from 'puppeteer';

async function testNintendoKRDetail2() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://store.nintendo.co.kr/70010000000185', { waitUntil: 'networkidle2' });
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 2000));
  await browser.close();
}
testNintendoKRDetail2();
