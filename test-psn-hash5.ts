import axios from 'axios';
import * as cheerio from 'cheerio';

async function extractPSNHash() {
  try {
    const res = await axios.get('https://store.playstation.com/ko-kr/pages/latest', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    const scripts = $('script[src]').toArray();
    for (const script of scripts) {
      const src = $(script).attr('src');
      if (src && src.endsWith('.js')) {
        try {
          const url = src.startsWith('http') ? src : `https://store.playstation.com${src}`;
          const jsRes = await axios.get(url);
          const text = jsRes.data;
          const hexMatches = text.match(/[a-f0-9]{64}/g);
          if (hexMatches) {
            console.log(`Found ${hexMatches.length} hex strings in ${src}`);
            if (text.includes('categoryGridRetrieve')) {
               console.log("  AND it contains categoryGridRetrieve!");
            }
          }
        } catch (e) {}
      }
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
extractPSNHash();
