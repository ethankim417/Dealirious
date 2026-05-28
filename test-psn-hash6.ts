import axios from 'axios';

async function extractPSNHash() {
  try {
    const url = 'https://store.playstation.com/_next/static/chunks/cfb6898d.c72313f2927c6773403f.js';
    const jsRes = await axios.get(url);
    const text = jsRes.data;
    const hexMatches = text.match(/[a-f0-9]{64}/g);
    console.log("Hex strings:", hexMatches);
    
    const idx = text.indexOf('categoryGridRetrieve');
    if (idx !== -1) {
      console.log("Context:");
      console.log(text.substring(Math.max(0, idx - 100), idx + 200));
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
extractPSNHash();
