import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
  try {
    const res = await axios.get("https://www.xbox.com/en-US/games/browse/DynamicChannel.GameDeals?skipItems=25", {
      headers: { "Cookie": "aka_locale=en-US" }
    });
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
      console.log("Found", ids.length, "games.");
      if (ids.length > 0) {
        console.log("First title:", summaries[ids[0]].title);
      }
    }
  } catch(e) { console.error(e.message); }
}
main();
