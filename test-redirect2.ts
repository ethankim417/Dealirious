import axios from 'axios';

async function testRedirect2() {
  try {
    const res = await axios.get('https://www.cheapshark.com/redirect?dealID=8QvDH36tjwL6g0pnGK5%2F7QrVnkND1Sg2mhSjs8oKN8g%3D');
    console.log("Final URL:", res.request.res.responseUrl);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testRedirect2();
