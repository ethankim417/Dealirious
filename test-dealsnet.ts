import axios from 'axios';
import * as cheerio from 'cheerio';

async function testDealsNet() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

  console.log("--- Testing PSDeals ---");
  try {
    const res = await axios.get('https://psdeals.net/kr-store/discounts', { headers, timeout: 5000 });
    const $ = cheerio.load(res.data);
    console.log("PSDeals Success! Items:", $('.game-collection-item').length);
  } catch (e: any) { console.log("PSDeals Failed:", e.message); }

  console.log("--- Testing NTDeals ---");
  try {
    const res = await axios.get('https://ntdeals.net/kr-store/discounts', { headers, timeout: 5000 });
    const $ = cheerio.load(res.data);
    console.log("NTDeals Success! Items:", $('.game-collection-item').length);
  } catch (e: any) { console.log("NTDeals Failed:", e.message); }
}

testDealsNet();
