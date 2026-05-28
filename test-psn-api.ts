import axios from 'axios';

async function checkPsnApi() {
  try {
    const res = await axios.get('https://registry.npmjs.org/psn-api');
    const readme = res.data.readme;
    const lines = readme.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('store') || lines[i].toLowerCase().includes('price')) {
        console.log(`Line ${i}: ${lines[i]}`);
      }
    }
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
checkPsnApi();
