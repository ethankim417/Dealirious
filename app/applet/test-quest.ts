import puppeteer from 'puppeteer';

async function fetchQuestDeals() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.meta.com/experiences/section/1888816384764129/', { waitUntil: 'networkidle2' });
  const content = await page.content();
  console.log("HTML length:", content.length);
  // Let's also look for script tags that contain "__RELAY_STORE__" or "initialProps"
  const match = content.match(/__RELAY_STORE__.*?(\{.*?\})\s*;/);
  if (match) {
    console.log("Found Relay Store mapping!");
  }
  await browser.close();
}
fetchQuestDeals();
