import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
  try {
    const { data } = await axios.get('https://xbox-store-checker.com/en/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(data);
    const text = $('body').text().substring(0, 500);
    console.log(text);
  } catch (e) {
    console.log(e.message);
  }
}
main();
