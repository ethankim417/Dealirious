import axios from "axios";
import * as cheerio from "cheerio";
async function main() {
  try {
    const res = await axios.get("https://xbdeals.net/us-store/discounts?type=games", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
      }
    });
    const $ = cheerio.load(res.data);
    $(".game-collection-item-link").each((i, el) => {
       if (i > 3) return;
       const title = $(el).find(".game-collection-item-details-title").text().trim();
       console.log(title);
    });
  } catch(e) { console.error(e.message); }
}
main();
