import { getGamesAmerica } from 'nintendo-switch-eshop';

async function testNintendoGenres() {
  const games = await getGamesAmerica();
  const deals = games.filter(g => g.salePrice != null && g.msrp != null && g.salePrice < g.msrp);
  console.log(deals.slice(0, 5).map(g => g.genres));
}
testNintendoGenres();
