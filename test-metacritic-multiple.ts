import { MetacriticService } from 'metacritic-ts';

async function testMultiple() {
  const mc = new MetacriticService();
  const games = [
    "Marvel's Spider-Man 2",
    "The Last of Us Part I",
    "Horizon Forbidden West",
    "God of War Ragnarök",
    "Ghost of Tsushima",
    "Super Mario Odyssey",
    "The Legend of Zelda: Tears of the Kingdom",
    "Animal Crossing: New Horizons",
    "Mario Kart 8 Deluxe",
    "Super Smash Bros. Ultimate"
  ];

  console.time("fetch");
  for (const game of games) {
    try {
      const result = await mc.search(game);
      if (result && result.length > 0) {
        console.log(`${game}: ${result[0].criticScore}`);
      } else {
        console.log(`${game}: Not found`);
      }
    } catch (e: any) {
      console.log(`${game}: Error - ${e.message}`);
    }
  }
  console.timeEnd("fetch");
}
testMultiple();
