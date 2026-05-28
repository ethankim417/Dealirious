import axios from 'axios';

async function getMetacritic(title: string) {
  try {
    const res = await axios.get(`https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(title)}&limit=1`);
    if (res.data && res.data.length > 0) {
      const score = parseInt(res.data[0].metacriticScore);
      return score > 0 ? score : undefined;
    }
  } catch (e) {
    return undefined;
  }
}

async function test() {
  console.log("Spider-Man 2:", await getMetacritic("Marvel's Spider-Man 2"));
  console.log("The Last of Us Part I:", await getMetacritic("The Last of Us Part I"));
  console.log("Super Mario Odyssey:", await getMetacritic("Super Mario Odyssey"));
}
test();
