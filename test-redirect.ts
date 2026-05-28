import axios from 'axios';

async function testRedirect() {
  try {
    const res = await axios.get('https://www.cheapshark.com/redirect?dealID=8QvDH36tjwL6g0pnGK5%2F7QrVnkND1Sg2mhSjs8oKN8g%3D', {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });
    console.log("Redirects to:", res.headers.location);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testRedirect();
