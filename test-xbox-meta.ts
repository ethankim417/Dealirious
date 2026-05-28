import axios from "axios";
import * as cheerio from "cheerio";
async function main() {
  const res = await axios.get("https://www.xbox.com/en-US/games/store/assassins-creed-mirage-master-assassin-edition/9P0BGLW9XXZV");
  const $ = cheerio.load(res.data);
  const title = $("h1").text().trim() || $("title").text().trim();
  const price = $("span[itemprop='price']").text().trim() || $(".Price-module__brandPrice___v11_m").first().text().trim() || "N/A";
  console.log(title, price);
}
main();
