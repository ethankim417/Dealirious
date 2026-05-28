import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchPSNDeals() {
  try {
    // 1. Get the deals page
    const dealsRes = await axios.get('https://store.playstation.com/ko-kr/pages/deals', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $deals = cheerio.load(dealsRes.data);
    
    // Find the first category link
    const categoryLink = $deals('a[href^="/ko-kr/category/"]').first().attr('href');
    if (!categoryLink) {
      console.log("No category link found");
      return;
    }
    
    console.log("Category link:", categoryLink);
    
    // 2. Fetch the category page
    const categoryRes = await axios.get(`https://store.playstation.com${categoryLink}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $cat = cheerio.load(categoryRes.data);
    
    // 3. Extract Apollo State
    const nextDataStr = $cat('#__NEXT_DATA__').text();
    if (!nextDataStr) {
      console.log("No NEXT_DATA found");
      return;
    }
    
    const nextData = JSON.parse(nextDataStr);
    const apolloState = nextData.props?.apolloState;
    if (!apolloState) {
      console.log("No apolloState found");
      return;
    }
    
    // 4. Parse Products
    const products = Object.values(apolloState).filter((item: any) => item.__typename === 'Product');
    console.log(`Found ${products.length} products in Apollo state.`);
    
    const deals = products.map((p: any) => {
      const price = p.price;
      if (!price || !price.discountedPrice || price.basePrice === price.discountedPrice) return null;
      
      // Find image
      const media = p.media || [];
      const image = media.find((m: any) => m.role === 'MASTER' || m.role === 'EDITION_KEY_ART')?.url || media.find((m: any) => m.type === 'IMAGE')?.url;
      
      return {
        title: p.name,
        originalPrice: price.basePrice,
        salePrice: price.discountedPrice,
        discount: price.discountText,
        image: image,
        url: `https://store.playstation.com/ko-kr/product/${p.id}`
      };
    }).filter(d => d !== null);
    
    console.log(`Extracted ${deals.length} deals.`);
    console.log(deals.slice(0, 3));
    
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
fetchPSNDeals();
