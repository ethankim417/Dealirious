import axios from "axios";

async function main() {
  const q = "assassins creed oddeysey";
  try {
    const res = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=kr`);
    console.log("Steam returns:", res.data.items?.map(i => i.name));
  } catch (e) {
    console.error(e.message);
  }
}

main();
