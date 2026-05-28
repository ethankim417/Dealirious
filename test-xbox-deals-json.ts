import axios from "axios";
import * as cheerio from "cheerio";
async function main() {
  const res = await axios.get("https://www.xbox.com/en-us/games/all-games?cat=onsale");
  const $ = cheerio.load(res.data);
  $("script").each((i, el) => {
    const t = $(el).html() || "";
    if (t.includes("PRELOADED_STATE")) {
       const jsonStr = t.split("window.__PRELOADED_STATE__ = ")[1].split(";")[0];
       const json = JSON.parse(jsonStr);
       console.log(Object.keys(json));
       if (json.core) console.log(Object.keys(json.core));
    }
  });
}
main();
