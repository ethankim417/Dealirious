import axios from "axios";

async function main() {
  const q = "assassins creed odyssey"; // correctly spelled
  const res = await axios.get(`https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(q)}&storeID=25`);
  console.log("Results from Epic for properly spelled Odyssey:");
  console.log(res.data.map(d => ({title: d.title, salePrice: d.salePrice, storeID: d.storeID})));
}

main();
