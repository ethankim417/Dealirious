import axios from 'axios';

async function testCheapSharkGame() {
  try {
    const res = await axios.get('https://www.cheapshark.com/api/1.0/games?id=612');
    console.log(res.data);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testCheapSharkGame();
