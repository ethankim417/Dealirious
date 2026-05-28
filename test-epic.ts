import axios from "axios";

async function main() {
  const q = "Assassin's Creed Odyssey";
  try {
    const res = await axios.get(`https://store-site-backend-static-ipv4.ak.epicgames.com/catalog/api/shared/namespace/epic/bulk/offers?q=${encodeURIComponent(q)}`);
    console.log(res.data);
  } catch (e) {
    console.error(e.message);
  }
}

main();
