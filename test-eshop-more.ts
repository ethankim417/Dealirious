import { getGamesAmerica, getGamesEurope, getGamesJapan, getQueriedGamesAmerica } from 'nintendo-switch-eshop';

async function testEshopMore() {
  try {
    console.log("Fetching America with query...");
    const games = await getQueriedGamesAmerica({
      hitsPerPage: 10,
      filters: 'generalFilters:Deals'
    });
    console.log("Found deals:", games.length);
    if (games.length > 0) {
      console.log(games[0].title, games[0].salePrice, games[0].msrp);
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testEshopMore();
