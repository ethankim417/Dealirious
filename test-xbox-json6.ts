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
      console.log("Found", ids.length, "products");
      
      const sales = [];
      for (const id of ids) {
         const p = summaries[id];
         const avail = state.core2?.products?.availabilitySummaries?.[id];
         // console.log("avail for", id, avail);
         sales.push({
           title: p.title,
           image: p.images?.find((img: any) => img.imagePurpose === "Poster" || img.imagePurpose === "BoxArt")?.uri || p.images?.[0]?.uri,
           // Need price info!
         });
      }
      console.log(sales.slice(0, 3));
      
      const firstId = ids[0];
      console.log("Avail Data for first:", JSON.stringify(state.core2?.products?.availabilitySummaries?.[firstId], null, 2));
    }
  } catch(e) { console.error(e); }
}
main();
