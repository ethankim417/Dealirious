import axios from "axios";

async function main() {
  try {
    const res = await axios.get("https://store-content-ipv4.ak.epicgames.com/api/en-US/content/products?q=Assassin");
    console.log("Got response!");
  } catch (e) {
    console.error(e.message);
  }
}
main();
