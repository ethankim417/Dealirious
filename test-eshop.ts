import { getGamesAmerica, getGamesEurope, getGamesJapan } from 'nintendo-switch-eshop';

async function testEshop() {
  try {
    console.log("Fetching America...");
    const games = await getGamesAmerica();
    console.log("Found:", games.length);
    console.log(games[0]);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testEshop();
