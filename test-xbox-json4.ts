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
      if (state.core2) {
         if (state.core2.products) {
            console.log("Number of products:", Object.keys(state.core2.products.idMap).length || Object.keys(state.core2.products).length);
            const firstProductId = Object.keys(state.core2.products)[0];
            const sample = state.core2.products[firstProductId];
            if (sample) {
              console.log("Sample product key:", firstProductId);
              const p = sample.product || sample;
              console.log("Title:", p?.localizedProperties?.[0]?.productTitle || p.title || p);
              console.log("Displays:", p?.displaySkuAvailabilities?.[0]?.availabilities?.[0]?.orderManagementData?.price || p?.price || p);
            }
         }
      }
    }
  } catch (e) {
    console.log(e.message);
  }
}
main();
