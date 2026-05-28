import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

async function testRss() {
  try {
    const res = await axios.get('https://blog.playstation.com/category/ps-plus/feed/');
    const parser = new XMLParser();
    const result = parser.parse(res.data);
    const items = result.rss?.channel?.item;
    if (items) {
      const monthly = items.find((i: any) => i.title && i.title.includes('Monthly Games for'));
      if (monthly) {
        console.log("Found:", monthly.title);
        const index = monthly.title.indexOf(':');
        if (index !== -1) {
            let gamesRaw = monthly.title.substring(index + 1).trim();
            const games = gamesRaw.split(',').map((g: string) => g.trim().replace(/ and more$/i, ''));
            console.log("Games:", games);
        }
      }
    }
  } catch(e: any) {
    console.error("error:", e.message);
  }
}
testRss();
