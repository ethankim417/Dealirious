import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
  try {
    const res = await axios.get("https://www.xbox.com/en-us/Search?q=assassins+creed");
    const $ = cheerio.load(res.data);
    
    // Look for script tags with JSON
    let found = false;
    $("script").each((i, el) => {
      const t = $(el).html() || "";
      if (t.includes("assassins") || t.includes("Assassins")) {
         console.log(t.substring(0, 300));
         found = true;
      }
    });
    if (!found) console.log("No scripts with assassins found.");
  } catch (e) {
    console.error(e.message);
  }
}
main();
