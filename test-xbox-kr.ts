import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
  try {
    const res = await axios.get("https://www.xbox.com/ko-KR/games/browse/DynamicChannel.GameDeals", {
      headers: { "Cookie": "aka_locale=ko-KR" },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });
    console.log("Status:", res.status);
    console.log("Location:", res.headers.location);
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
      if (ids.length > 0) {
        const p = summaries[ids[0]];
        const avail = state.core2?.products?.availabilitySummaries?.[ids[0]];
        const priceObj = avail?.[p.preferredSkuId || "0010"]?.["9XR73HF18CZ6"]?.price || avail?.[Object.keys(avail)[0]]?.[Object.keys(avail?.[Object.keys(avail)[0]])[0]]?.price;
        console.log("Title KR:", p.title);
        console.log("Price KR:", priceObj);
      }
    }
  } catch(e) { console.error(e.message); }
}
main();
