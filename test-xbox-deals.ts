import axios from "axios";
import * as cheerio from "cheerio";
async function main() {
  const res = await axios.get("https://www.xbox.com/en-us/games/all-games?cat=onsale");
  const $ = cheerio.load(res.data);
  let found = false;
  $("script").each((i, el) => {
    const t = $(el).html() || "";
    if (t.includes("PRELOADED_STATE")) {
       console.log(t.substring(0, 500));
       found = true;
    }
  });
}
main();
