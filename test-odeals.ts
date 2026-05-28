import axios from 'axios';
import * as cheerio from 'cheerio';
async function run() {
  try {
    const res = await axios.get('https://odeals.net/platform/quest/discount', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    const rawResults: any[] = [];
    
    $('a.game-item').each((i, el) => {
      if (rawResults.length >= 10) return;
      
      const title = $(el).find('.heading').text().trim();
      if (!title) return;
      
      let salePriceStr = $(el).find('.text-danger').text().trim();
      let originalPriceStr = $(el).find('del').text().trim();
      
      if (salePriceStr.toUpperCase() === 'FREE') salePriceStr = '$0.00';
      if (!originalPriceStr) originalPriceStr = salePriceStr;
      
      const salePriceNum = parseFloat(salePriceStr.replace(/[^0-9.-]+/g, ""));
      const originalPriceNum = parseFloat(originalPriceStr.replace(/[^0-9.-]+/g, ""));
      let discountPercent = 0;
      
      const discountStr = $(el).find('.game-item-sale').text().trim();
      if (discountStr) {
        discountPercent = parseInt(discountStr.replace(/[^0-9]/g, ""));
      } else if (originalPriceNum && salePriceNum) {
        discountPercent = Math.round(((originalPriceNum - salePriceNum) / originalPriceNum) * 100);
      }
      
      const image = $(el).find('img').attr('src') || `https://picsum.photos/seed/${encodeURIComponent(title)}/400/225`;
      
      rawResults.push({
        name: title,
        price: salePriceStr,
        price_numeric: salePriceNum,
        original_price: originalPriceStr,
        discount_percent: discountPercent,
        image: image,
        url: `https://www.meta.com/experiences/search/?q=${encodeURIComponent(title)}`
      });
    });
    
    console.log(rawResults);
  } catch(e) { console.log(e.response ? e.response.status : e.message); }
}
run();
