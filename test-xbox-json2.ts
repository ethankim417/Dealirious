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
         // The JSON string goes to the end of the line/semicolon, but since there might be semicolons inside the JSON, this is tricky.
         // Let's just find the last brace.
         // Actually, Xbox's script is literally: window.__PRELOADED_STATE__ = {...};\n
         jsonStr = jsonStr.substring(0, jsonStr.lastIndexOf("}") + 1);
      }
    });
    
    if (jsonStr) {
      const state = JSON.parse(jsonStr);
      console.log(Object.keys(state));
      if (state.core) {
         console.log("Core:", Object.keys(state.core));
         if (state.core.products) {
            console.log("Products keys length:", Object.keys(state.core.products).length);
            const firstProductId = Object.keys(state.core.products)[0];
            console.log("Sample product:", state.core.products[firstProductId]);
         }
      } else if (state.gameList) {
         console.log("gameList:", state.gameList);
      } else {
        console.log("Look at:", state);
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}
main();
