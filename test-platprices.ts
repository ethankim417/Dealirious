async function testPlatPrices() {
  try {
    const res = await fetch('https://platprices.com/ko-kr/ps5/discounts', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Length:", text.length);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
testPlatPrices();
