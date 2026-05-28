import axios from 'axios';
async function test() {
  const res = await axios.get('https://store.playstation.com/en-us/search/Persona%205', {headers: {'User-Agent': 'Mozilla/5.0'}});
  const match = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (match) {
    const json = JSON.parse(match[1]);
    const keys = Object.keys(json.props.apolloState).filter(k=>k.startsWith('Product:'));
    for (const k of keys.slice(0, 1)) {
        console.log(JSON.stringify(json.props.apolloState[k].price, null, 2));
    }
  }
}
test();
