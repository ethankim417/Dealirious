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
      const summaries = state.core2?.products?.productSummaries || {};
      const ids = Object.keys(summaries);
      
      const firstId = ids[0];
      console.log("Summary:", JSON.stringify(summaries[firstId], null, 2));
      console.log("Avail:", JSON.stringify(state.core2?.products?.availabilitySummaries?.[firstId], null, 2));
    }
  } catch(e) { console.error(e); }
}
main();
