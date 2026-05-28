import axios from 'axios';
import * as cheerio from 'cheerio';

async function testNintendoKRAxios() {
  try {
    const res = await axios.get('https://store.nintendo.co.kr/games/sale', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    
    const items = $('.product-item').toArray();
    console.log("Found .product-item:", items.length);
    
    items.slice(0, 3).forEach(el => {
      const title = $(el).find('.product-item-link').text().trim();
      const url = $(el).find('.product-item-link').attr('href');
      const image = $(el).find('.product-image-photo').attr('src');
      
      const specialPrice = $(el).find('.special-price .price').text().trim();
      const oldPrice = $(el).find('.old-price .price').text().trim();
      
      console.log({ title, url, image, specialPrice, oldPrice });
    });
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testNintendoKRAxios();
