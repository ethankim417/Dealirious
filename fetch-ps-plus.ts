import axios from 'axios';
import fs from 'fs';

async function test() {
  const psnResponse = await axios.get(`https://store.playstation.com/en-us/pages/subscriptions`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  
  const match = psnResponse.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (match) {
    const json = JSON.parse(match[1]);
    const state = json.props.apolloState;
    fs.writeFileSync('psplus-state.json', JSON.stringify(state, null, 2));
    
    // Attempt to find PS Plus monthly games in the apollo state
    const products = Object.keys(state)
        .filter(k => k.startsWith('Product:'))
        .map(k => state[k])
        .filter(p => true); // just examine products
        
    console.log("Total Products:", products.length);
    console.log("Wrote psplus-state.json");
    
    const psPlusInfo = Object.keys(state).filter(k => k.toLowerCase().includes('plus'));
    console.log("Plus keys:", psPlusInfo.length);
  } else {
    console.log("No match");
  }
}

test();
