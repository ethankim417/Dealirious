import axios from "axios";
import * as cheerio from "cheerio";
async function main() {
  const res = await axios.get("https://www.xbox.com/en-us/games/all-games?cat=onsale");
  const $ = cheerio.load(res.data);
  const titles: string[] = [];
  $("h3").each((i, el) => {
    titles.push($(el).text().trim());
  });
  console.log(titles.slice(0, 10));
}
main();
