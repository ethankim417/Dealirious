const axios = require("axios");

async function run() {
  try {
    const res = await axios.get("https://store.steampowered.com/api/storesearch/?term=cyberpunk&l=english&cc=us");
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();
