import * as mc from 'metacritic-ts';
import metacriticApi from '@alepertu/metacritic-api';

async function testMetacritic() {
  try {
    console.log("Testing metacritic-ts exports:", Object.keys(mc));
  } catch (e: any) {
    console.log("metacritic-ts failed:", e.message);
  }

  try {
    console.log("Testing @alepertu/metacritic-api...");
    const result2 = await metacriticApi("Super Mario Odyssey");
    console.log(result2);
  } catch (e: any) {
    console.log("@alepertu/metacritic-api failed:", e.message);
  }
}
testMetacritic();
