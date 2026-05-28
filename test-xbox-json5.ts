import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
  try {
    const res = await axios.get("https://www.xbox.com/en-us/games/all-games?cat=onsale");
    const $ = cheerio.load(res.data);
    let jsonStr = "";
    $("script").each((i, el) => {
      const t = $(el).html() || "";
      if (t.includes("window.__PRELOADED_STATE__ = {")) {
         jsonStr = t.split("window.__PRELOADED_STATE__ = ")[1];
         jsonStr = jsonStr.split("};")[0] + "}";
      }
    });

    if (jsonStr) {
      const state = JSON.parse(jsonStr);
      if (state.core2?.products) {
         console.log(Object.keys(state.core2.products));
         const list = state.core2.products.productDetails;
         if (list) {
            console.log("Keys in productDetails:", Object.keys(list).slice(0, 5));
            const first = Object.keys(list)[0];
            const p = list[first];
            console.log("Title:", p?.localizedProperties?.[0]?.productTitle || p.title || p.productTitle);
         } else {
             // maybe it's not productDetails?
         }
      }
    }
  } catch(e) { console.error(e); }
}
main();
