import { MetacriticService } from "metacritic-ts";
const mcService = new MetacriticService();
console.log('Testing mcService...');
mcService.search('Deus Ex').then(res => {
  console.log('Got result:', res);
}).catch(e => {
  console.log('Error:', e);
});
