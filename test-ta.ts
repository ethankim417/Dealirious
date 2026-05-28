import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
  try {
    const { data } = await axios.get('https://www.trueachievements.com/xbox-sales', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const $ = cheerio.load(data);
    const games = [];
    $('.oGame .title').each((i, el) => {
      games.push($(el).text().trim());
    });
    console.log(games.slice(0, 10));
  } catch (e) {
    console.log(e.message);
  }
}
main();
