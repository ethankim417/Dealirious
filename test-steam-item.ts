import axios from "axios";

async function main() {
  const res = await axios.get("https://store.steampowered.com/api/featuredcategories/?cc=us&l=english");
  const specials = res.data.specials?.items || [];
  console.log(specials[0]);
}
main();
