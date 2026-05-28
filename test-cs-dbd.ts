import axios from "axios";

async function main() {
  const storeID = "25"; // epic
  const res = await axios.get(`https://www.cheapshark.com/api/1.0/deals?title=Dead%20by%20Daylight&storeID=${storeID}`);
  console.log("Epic deals for Dead by daylight:");
  console.log(res.data.map(d => ({title: d.title, dealID: d.dealID})));
}

main();
