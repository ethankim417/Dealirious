import axios from 'axios';
import * as cheerio from 'cheerio';

async function extractNintendoKeys() {
  try {
    const res = await axios.get('https://www.nintendo.com/us/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    const scripts = $('script').toArray();
    for (const script of scripts) {
      const text = $(script).text();
      const src = $(script).attr('src');
      if (text.includes('algolia') || text.includes('U3B6GR4UA3')) {
        console.log("Found algolia in inline script!");
      }
      if (src) {
        // console.log(src);
      }
    }
    
    // Check __NEXT_DATA__
    const nextData = $('#__NEXT_DATA__').text();
    if (nextData) {
      const match = nextData.match(/"apiKey":"([^"]+)","appId":"([^"]+)"/);
      if (match) {
        console.log("Found in NEXT_DATA:", match[1], match[2]);
      } else {
        const algoliaMatch = nextData.match(/algolia/i);
        if (algoliaMatch) console.log("Algolia mentioned in NEXT_DATA");
      }
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
extractNintendoKeys();
