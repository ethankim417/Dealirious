import { getStoreData } from 'ps-scraper';

async function testPsScraper() {
  try {
    const data = await getStoreData('ko-kr');
    console.log(data);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPsScraper();
