import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkPSNGameGenre2() {
  try {
    const res = await axios.get('https://store.playstation.com/en-us/product/UP6322-PPSA18605_00-0342498734252743');
    const $ = cheerio.load(res.data);
    const nextData = JSON.parse($('#__NEXT_DATA__').text());
    const apolloState = nextData.props?.apolloState;
    
    for (const key in apolloState) {
      const item = apolloState[key];
      if (item && typeof item === 'object' && item.genres) {
        console.log(`Found genres in ${item.__typename}:`, item.genres);
      }
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
checkPSNGameGenre2();
