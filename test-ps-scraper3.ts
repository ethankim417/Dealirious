import { getPSGames } from 'ps-scraper';

async function testPsScraper() {
  try {
    const data = await getPSGames({ region: 'us' });
    console.log("Length:", data?.length);
    if (data?.length > 0) {
      console.log(data[0]);
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPsScraper();
