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
          if (jsRes.data.includes('categoryGridRetrieve')) {
            console.log(`Found categoryGridRetrieve in ${src}!`);
            // Extract the hash near it
            const match = jsRes.data.match(/id:"categoryGridRetrieve",.+?sha256Hash:"([a-f0-9]{64})"/);
            if (match) {
              console.log("Hash:", match[1]);
            } else {
              // Try another pattern
              const match2 = jsRes.data.match(/queryId:"([a-f0-9]{64})"/g);
              console.log("Other hashes:", match2);
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
