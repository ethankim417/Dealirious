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
      // It might still break if there is } ; inside a string. Let's just try to parse it.
      const state = JSON.parse(jsonStr);
      console.log("Keys:", Object.keys(state));
      const ns = Object.keys(state);
      for (const key of ns) {
        if (key !== "appContext" && key !== "experiments") {
            console.log(key, Object.keys(state[key]||{}));
        }
      }
    }
  } catch (e) {
    console.log(e.message);
  }
}
main();
