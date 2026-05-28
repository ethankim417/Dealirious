import axios from 'axios';

async function searchGithub() {
  try {
    const res = await axios.get('https://api.github.com/search/repositories?q=nintendo+eshop+api+deals');
    console.log(res.data.items.slice(0, 5).map((i: any) => i.full_name + ": " + i.description));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
searchGithub();
