import axios from "axios";

async function main() {
  const q = "Assassin";
  const storeID = "25"; // epic
  const res = await axios.get(`https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(q)}&storeID=${storeID}`);
  console.log("Results from Epic for Assassin:");
  console.log(res.data.map(d => ({title: d.title, salePrice: d.salePrice, storeID: d.storeID})));
}

main();
