import { MetacriticService } from 'metacritic-ts';

async function testMetacritic() {
  try {
    const mc = new MetacriticService();
    const result = await mc.search("Super Mario Odyssey");
    console.log(result);
  } catch (e: any) {
    console.log("metacritic-ts failed:", e.message);
  }
}
testMetacritic();
