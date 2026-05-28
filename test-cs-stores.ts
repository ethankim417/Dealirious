import axios from "axios";
async function main() {
  const res = await axios.get("https://www.cheapshark.com/api/1.0/stores");
  console.log(res.data.map((s: any) => `${s.storeID}: ${s.storeName}`));
}
main();
