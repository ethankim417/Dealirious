import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
  try {
    const { data } = await axios.get('https://psprices.com/region-us/games/?platform=XOne&sort=percent', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0'
      }
    });
    const $ = cheerio.load(data);
    const games = [];
    $('.component--game-card').each((i, el) => {
      if (i > 5) return;
      const title = $(el).find('a.line-clamp-2').text().trim();
      const price = $(el).find('.text-emerald-500').last().text().trim();
      games.push({title, price});
    });
    console.log(games);
  } catch (e) {
    console.log(e.message);
  }
}
main();
