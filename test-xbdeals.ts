import axios from "axios";
import * as cheerio from "cheerio";
async function main() {
  try {
    const res = await axios.get("https://xbdeals.net/us-store/discounts?type=games", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    const $ = cheerio.load(res.data);
    $(".game-collection-item-link").each((i, el) => {
       if (i > 3) return;
       const title = $(el).find(".game-collection-item-details-title").text().trim();
       const price = $(el).find(".game-collection-item-price").text().trim();
       const regularPrice = $(el).find(".game-collection-item-regular-price").text().trim();
       const discount = $(el).find(".game-collection-item-discount").text().trim();
       console.log(title, price, regularPrice, discount);
    });
  } catch(e) { console.error(e.message); }
}
main();
