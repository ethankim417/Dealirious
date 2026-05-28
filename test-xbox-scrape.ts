import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
  try {
    const res = await axios.get("https://www.xbox.com/en-us/Search?q=assassins+creed");
    const $ = cheerio.load(res.data);
    const text = $("body").text();
    console.log(text.substring(0, 500));
  } catch (e) {
    console.error(e.message);
  }
}
main();
