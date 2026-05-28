import { getGamesAmerica } from 'nintendo-switch-eshop';

async function testEshopDeals() {
  try {
    const games = await getGamesAmerica();
    const deals = games.filter(g => 
      g.salePrice != null && 
      g.msrp != null && 
      g.salePrice < g.msrp
    );
    console.log("Total games:", games.length);
    console.log("Deals found:", deals.length);
    if (deals.length > 0) {
      console.log(deals.slice(0, 5).map(d => `${d.title}: $${d.salePrice} (was $${d.msrp})`));
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testEshopDeals();
