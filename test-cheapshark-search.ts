import axios from 'axios';

async function testCheapShark() {
  try {
    const res = await axios.get('https://www.cheapshark.com/api/1.0/games?title=batman&limit=5');
    console.log(res.data);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testCheapShark();
