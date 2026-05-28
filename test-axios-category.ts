import axios from 'axios';
import * as cheerio from 'cheerio';

async function testAxiosCategory() {
  try {
    const res = await axios.get('https://store.playstation.com/ko-kr/category/3f772501-f6f8-49b7-abac-874a88ca4897/1', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    
    // Find all list items
    const items = $('li').toArray();
    console.log("Total li elements:", items.length);
    
    let found = 0;
    items.forEach(el => {
      const title = $(el).find('[data-qa="psw-product-tile__title"]').text().trim() || $(el).find('.psw-t-body').text().trim();
      const priceText = $(el).text();
      
      if (title && priceText.includes('원')) {
        found++;
      }
    });
    
    console.log("Found items:", found);
    
    // Check apollo state
    const apolloState = $('#__NEXT_DATA__').text();
    if (apolloState) {
      console.log("NEXT_DATA length:", apolloState.length);
      const data = JSON.parse(apolloState);
      const apollo = data.props?.apolloState;
      if (apollo) {
        const keys = Object.keys(apollo);
        console.log("Apollo keys:", keys.length);
        const products = keys.filter(k => k.startsWith('Product:'));
        console.log("Products:", products.length);
        if (products.length > 0) {
          console.log(apollo[products[0]]);
        }
      }
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testAxiosCategory();
