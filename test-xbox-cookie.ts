import axios from "axios";

async function main() {
  try {
    const res = await axios.get("https://www.xbox.com/en-US/games/browse/DynamicChannel.GameDeals", {
      headers: {
        "Cookie": "aka_locale=en-US",
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });
    console.log("Status:", res.status);
    console.log("Location:", res.headers.location);
  } catch(e) { console.error(e.message); }
}
main();
