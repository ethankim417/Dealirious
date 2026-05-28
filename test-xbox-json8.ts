import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
  try {
    const res = await axios.get("https://www.xbox.com/en-US/games/browse/DynamicChannel.GameDeals");
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
      console.log("Core2 Keys:", Object.keys(state.core2));
      console.log("ContextualStore:", Object.keys(state.core2.contextualStore || {}));
      console.log("Search:", Object.keys(state.core2.search || {}));
      console.log("Search request:", JSON.stringify(state.core2.contextualStore, null, 2).substring(0, 500));
    }
  } catch(e) { console.error(e.message); }
}
main();
