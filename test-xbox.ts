import axios from "axios";
async function main() {
  try {
    const res = await axios.get("https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=9NCBCZG6T746&market=US&languages=en-US&MS-CV=DGU1mcuYo0WMMp+F.1");
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error(e.message);
  }
}
main();
