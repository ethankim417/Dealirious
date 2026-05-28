import axios from 'axios';

async function testPSNGraphQL() {
  try {
    const res = await axios.get('https://web.np.playstation.com/api/graphql/v1/op?operationName=categoryGridRetrieve&variables={"id":"05a79eb2-f03f-443a-97a0-b091b5891546","pageArgs":{"size":24,"offset":0},"sortBy":{"name":"productName","isAscending":true},"filterBy":[],"facetOptions":[]}&extensions={"persistedQuery":{"version":1,"sha256Hash":"4ce7d410a4db2c8b63ce97818eeb60b1286ce762766dc418bf5463b3f56628d8"}}', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'x-psn-store-locale-override': 'ko-kr'
      }
    });
    console.log(res.data);
  } catch (e: any) {
    console.log(e.message);
    if (e.response) console.log(e.response.data);
  }
}
testPSNGraphQL();
