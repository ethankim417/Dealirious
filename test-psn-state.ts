import axios from 'axios';
import * as cheerio from 'cheerio';

async function testPSNState() {
  const psnUrl = "https://store.playstation.com/ko-kr/category/05a79eb2-f03f-443a-97a0-b091b5891546/1";
  const response = await axios.get(psnUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });
  const $ = cheerio.load(response.data);
  
  const scriptText = $('#__NEXT_DATA__').text();
  if (scriptText) {
    const data = JSON.parse(scriptText);
    console.log(JSON.stringify(data).substring(0, 500));
    
    // Let's try to find the apollo state
    const apolloState = data.props?.apolloState;
    if (apolloState) {
      const keys = Object.keys(apolloState);
      console.log("Apollo State Keys:", keys.length);
      const productKeys = keys.filter(k => k.startsWith('Product:'));
      console.log("Product Keys:", productKeys.length);
      if (productKeys.length > 0) {
        console.log("Sample Product:", JSON.stringify(apolloState[productKeys[0]]));
      }
    }
  }
}
testPSNState();
