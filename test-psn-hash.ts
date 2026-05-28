import axios from 'axios';
import * as cheerio from 'cheerio';

async function extractPSNHash() {
  try {
    const res = await axios.get('https://store.playstation.com/ko-kr/pages/latest', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    const scripts = $('script[src]').toArray();
    console.log(`Checking ${scripts.length} scripts...`);
    for (const script of scripts) {
      const src = $(script).attr('src');
      if (src && src.endsWith('.js')) {
        try {
          const url = src.startsWith('http') ? src : `https://store.playstation.com${src}`;
          const jsRes = await axios.get(url);
          const matches = jsRes.data.match(/sha256Hash:"([a-f0-9]{64})"/g);
          if (matches) {
            console.log(`Found hashes in ${src}:`, matches.length);
            console.log(matches.slice(0, 5));
          }
        } catch (e) {}
      }
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
extractPSNHash();
