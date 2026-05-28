import psn from 'psn-api';

async function testSearch() {
  try {
    const res = await psn.makeUniversalSearch(
      { accessToken: 'dummy' },
      'spider-man',
      'Game' // domain
    );
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testSearch();
