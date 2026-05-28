import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  try {
    const res = await axios.get('https://store.nintendo.co.kr/games/sale');
    const $ = cheerio.load(res.data);
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('games')) {
        links.push(href);
      }
    });
    console.log(links.slice(0, 10));
    
    // Test search
    const searchRes = await axios.get('https://store.nintendo.co.kr/catalogsearch/result/?q=Hades');
    console.log('Search Status:', searchRes.status);
    console.log('Search URL:', searchRes.request.res.responseUrl);
  } catch (e) {
    if (e.response) {
      console.log('Status:', e.response.status, 'Location:', e.response.headers.location);
    } else {
      console.log(e);
    }
  }
}
test();
