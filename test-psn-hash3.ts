import axios from 'axios';

async function extractPSNHash() {
  try {
    const url = 'https://store.playstation.com/_next/static/chunks/943974385bcd141121eea97dcc52749644517ac4.380d0d360e51551eb848.js';
    const jsRes = await axios.get(url);
    const text = jsRes.data;
    const idx = text.indexOf('categoryGridRetrieve');
    console.log("Context:");
    console.log(text.substring(Math.max(0, idx - 100), idx + 200));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
extractPSNHash();
