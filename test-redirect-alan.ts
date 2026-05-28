import axios from 'axios';

async function testRedirect() {
  try {
    const res = await axios.get('https://www.cheapshark.com/redirect?dealID=rcojZMCCEjsIs5C4iPRemAvRbXZt5MsqL%2BZT3rCiU9o%3D');
    console.log(res.data.substring(0, 500));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testRedirect();
