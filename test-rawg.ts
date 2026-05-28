import axios from 'axios';

async function testRawg() {
  try {
    const res = await axios.get('https://api.rawg.io/api/games?search=super%20mario%20odyssey');
    console.log(res.data);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testRawg();
