import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkPSNGameGenre() {
  try {
    const res = await axios.get('https://store.playstation.com/en-us/product/UP6322-PPSA18605_00-0342498734252743');
    const $ = cheerio.load(res.data);
    const nextData = JSON.parse($('#__NEXT_DATA__').text());
    const apolloState = nextData.props?.apolloState;
    
    const concepts = Object.values(apolloState).filter((item: any) => item.__typename === 'Concept');
    if (concepts.length > 0) {
      console.log("Concept genres:", concepts[0].genres);
    }
    
    const products = Object.values(apolloState).filter((item: any) => item.__typename === 'Product');
    if (products.length > 0) {
      console.log("Product genres:", products[0].genres);
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
checkPSNGameGenre();
