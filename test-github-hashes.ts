import axios from 'axios';

async function searchGithubHashes() {
  try {
    const res = await axios.get('https://api.github.com/search/code?q=categoryGridRetrieve+playstation+store');
    console.log(res.data.items.slice(0, 5).map((i: any) => i.repository.full_name + ": " + i.name));
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
searchGithubHashes();
