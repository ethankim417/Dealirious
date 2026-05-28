import axios from 'axios';

async function testCheapSharkDeals() {
  try {
    const res = await axios.get('https://www.cheapshark.com/api/1.0/deals?title=batman&limit=5');
    console.log(res.data.map((d: any) => ({ title: d.title, metacritic: d.metacriticScore, steamRating: d.steamRatingPercent })));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testCheapSharkDeals();
