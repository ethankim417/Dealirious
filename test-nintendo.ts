import axios from 'axios';

async function testNintendo() {
  try {
    const res = await axios.post(
      'https://u3b6gr4ua3-dsn.algolia.net/1/indexes/*/queries',
      {
        requests: [
          {
            indexName: "store_game_en_us",
            params: "query=&hitsPerPage=5&facetFilters=[[\"price.isDiscounted:true\"]]&numericFilters=[\"corePlatforms.metacriticScore>=80\"]"
          }
        ]
      },
      {
        headers: {
          'x-algolia-application-id': 'U3B6GR4UA3',
          'x-algolia-api-key': '9a20c93440cf63cf1a7008d75f7438bf'
        }
      }
    );
    console.log(res.data.results[0].hits.map((h: any) => ({
      title: h.title,
      price: h.price.salePrice,
      regular: h.price.regPrice,
      meta: h.corePlatforms?.[0]?.metacriticScore
    })));
  } catch (e: any) {
    console.error(e.response?.data || e.message);
  }
}
testNintendo();
