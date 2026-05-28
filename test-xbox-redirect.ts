import axios from "axios";

async function main() {
  try {
    const res = await axios.get("https://www.xbox.com/en-us/games/all-games?cat=onsale");
    console.log("Final URL:", res.request.res.responseUrl);
  } catch(e) { console.error(e); }
}
main();
