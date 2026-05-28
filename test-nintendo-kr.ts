import axios from 'axios';
import * as cheerio from 'cheerio';

async function testNintendoKR() {
  try {
    const res = await axios.get('https://store.nintendo.co.kr/games/sale', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    console.log("Found items:", $('.category-product-item').length);
    console.log($('body').text().substring(0, 200));
  } catch (e: any) {
    console.log(e.message);
  }
}
testNintendoKR();
