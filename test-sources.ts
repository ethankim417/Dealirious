import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSources() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

  console.log("--- Testing PSPrices RSS ---");
  try {
    const res = await axios.get('https://psprices.com/region-kr/rss/?platform=PS5', { headers, timeout: 5000 });
    const $ = cheerio.load(res.data, { xmlMode: true });
    console.log("PSPrices RSS Success! Items:", $('item').length);
    console.log($('item').first().find('title').text());
  } catch (e: any) { console.log("PSPrices RSS Failed:", e.message); }

  console.log("--- Testing DekuDeals RSS ---");
  try {
    const res = await axios.get('https://www.dekudeals.com/recent.rss', { headers, timeout: 5000 });
    const $ = cheerio.load(res.data, { xmlMode: true });
    console.log("DekuDeals RSS Success! Items:", $('item').length);
    console.log($('item').first().find('title').text());
  } catch (e: any) { console.log("DekuDeals RSS Failed:", e.message); }

  console.log("--- Testing PlatPrices ---");
  try {
    const res = await axios.get('https://platprices.com/ko-kr/news/ps5-sales', { headers, timeout: 5000 });
    console.log("PlatPrices Success! Status:", res.status);
  } catch (e: any) { console.log("PlatPrices Failed:", e.message); }
}

testSources();
