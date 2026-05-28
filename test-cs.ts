import axios from "axios";

async function main() {
  const q = "Assassin's Creed Odyssey";
  const storeID = "25"; // epic
  const res = await axios.get(`https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(q)}&storeID=${storeID}`);
  console.log("Results from Epic:");
  console.log(res.data.map(d => ({title: d.title, salePrice: d.salePrice, storeID: d.storeID})));
  
  const res2 = await axios.get(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(q)}`);
  console.log("Game search results:");
  console.log(res2.data);
}

main();
