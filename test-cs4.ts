import axios from "axios";

async function main() {
  const gameID = "188214";
  const res = await axios.get(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
  console.log("Game deals for 188214:");
  console.log(res.data.deals.map(d => ({storeID: d.storeID, price: d.price})));
}

main();
