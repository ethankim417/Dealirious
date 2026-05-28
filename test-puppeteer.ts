import puppeteer from 'puppeteer';

async function testPuppeteer() {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://store.playstation.com/ko-kr/pages/latest');
    const content = await page.content();
    console.log("Length:", content.length);
    const title = await page.title();
    console.log("Title:", title);
    await browser.close();
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPuppeteer();
