import axios from 'axios';

async function checkPsScraper() {
  try {
    const res = await axios.get('https://registry.npmjs.org/ps-scraper');
    console.log("Last updated:", res.data.time.modified);
    console.log("Readme:", res.data.readme.substring(0, 500));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
checkPsScraper();
