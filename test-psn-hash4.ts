import axios from 'axios';

async function extractPSNHash() {
  try {
    const url = 'https://store.playstation.com/_next/static/chunks/943974385bcd141121eea97dcc52749644517ac4.380d0d360e51551eb848.js';
    const jsRes = await axios.get(url);
    const text = jsRes.data;
    const matches = text.match(/sha256Hash:"([a-f0-9]{64})"/g);
    console.log("Hashes:", matches);
    
    // Also look for any 64-char hex strings
    const hexMatches = text.match(/[a-f0-9]{64}/g);
    console.log("Hex strings:", hexMatches);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
extractPSNHash();
