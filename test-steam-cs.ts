import axios from "axios";

async function main() {
  const storeID = "1"; // steam
  const res = await axios.get(`https://www.cheapshark.com/api/1.0/deals?storeID=${storeID}&onSale=1&sortBy=DealRating&pageNumber=0`);
  console.log("Steam deals from Cheapshark:");
  console.log(res.data.slice(0, 3).map((d: any) => ({title: d.title, salePrice: d.salePrice})));
}

main();
