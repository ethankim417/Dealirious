import { MetacriticService } from 'metacritic-ts';

async function checkMetacriticGenres() {
  const mc = new MetacriticService();
  const result = await mc.search("Super Mario Odyssey");
  console.log(result[0]);
}
checkMetacriticGenres();
