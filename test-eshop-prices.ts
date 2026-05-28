import { getGamesAmerica, getPrices } from 'nintendo-switch-eshop';

async function testEshopPrices() {
  try {
    const games = await getGamesAmerica();
    const deals = games.filter(g => g.generalFilters?.includes('Deals')).slice(0, 10);
    console.log("Deals found:", deals.length);
    
    const nsuids = deals.map(g => g.nsuid).filter(id => id);
    console.log("NSUIDs:", nsuids);
    
    const prices = await getPrices('US', nsuids);
    console.log("Prices:", JSON.stringify(prices, null, 2));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testEshopPrices();
