import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkPSNGenres() {
  try {
    const dealsRes = await axios.get('https://store.playstation.com/en-us/pages/deals', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $deals = cheerio.load(dealsRes.data);
    const categoryLink = $deals('a[href^="/en-us/category/"]').first().attr('href');
    
    const categoryRes = await axios.get(`https://store.playstation.com${categoryLink}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $cat = cheerio.load(categoryRes.data);
    const nextData = JSON.parse($cat('#__NEXT_DATA__').text());
    const apolloState = nextData.props?.apolloState;
    
    const products = Object.values(apolloState).filter((item: any) => item.__typename === 'Product');
    if (products.length > 0) {
      console.log(JSON.stringify(products[0], null, 2));
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
checkPSNGenres();
