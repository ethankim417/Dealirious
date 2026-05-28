import axios from 'axios';
import * as cheerio from 'cheerio';

async function searchMetacritic(title: string) {
  try {
    const url = `https://www.metacritic.com/search/${encodeURIComponent(title)}/?category=13`; // 13 is games
    const res = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const $ = cheerio.load(res.data.contents);
    
    const score = $('.c-siteReviewScore span').first().text().trim();
    console.log(`${title}: ${score}`);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}

async function test() {
  await searchMetacritic("Super Mario Odyssey");
  await searchMetacritic("Marvel's Spider-Man 2");
}
test();
