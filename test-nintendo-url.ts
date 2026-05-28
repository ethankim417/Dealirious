import { getGamesAmerica } from 'nintendo-switch-eshop';
async function run() {
  const games = await getGamesAmerica();
  const deals = games.filter(g => g.salePrice != null && g.msrp != null && g.salePrice < g.msrp);
  console.log(deals.slice(0, 3).map(d => ({ title: d.title, url: d.url })));
}
run();
