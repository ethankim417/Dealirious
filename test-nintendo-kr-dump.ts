import puppeteer from 'puppeteer';

async function dumpNintendoKR() {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://store.nintendo.co.kr/games/sale', { waitUntil: 'networkidle2' });
    const content = await page.content();
    console.log(content.substring(0, 1000));
    await browser.close();
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
dumpNintendoKR();
