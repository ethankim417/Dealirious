import axios from "axios";

async function main() {
  try {
    const res = await axios.get("https://store.epicgames.com/en-US/browse?q=Dead%20by%20Daylight");
    console.log("Status:", res.status);
  } catch (e) {
    if (e.response) {
      console.log("Error status:", e.response.status);
    } else {
      console.error(e.message);
    }
  }
}
main();
