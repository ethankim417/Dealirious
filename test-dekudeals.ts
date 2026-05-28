import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
  try {
    const res = await axios.get("https://dekudeals.com/games?filter[platform]=xbox&filter[discount]=discounted", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36",
        "Accept": "text/html"
      }
    });

    const $ = cheerio.load(res.data);
    const games: any[] = [];
    $(".item-grid2 .item").each((i, el) => {
       const title = $(el).find(".name").text().trim();
       const price = $(el).find(".price").first().text().trim(); // actually gives price
       const originalPrice = $(el).find(".text-muted strike").text().trim();
       const image = $(el).find("img").attr("src");
       const url = "https://dekudeals.com" + $(el).find("a.main-link").attr("href");
       games.push({title, price, originalPrice, image, url});
    });
    console.log(games.slice(0, 5));
  } catch (e) {
    console.log(e.message);
  }
}
main();
