import axios from 'axios';

async function checkRepo() {
  try {
    const res = await axios.get('https://api.github.com/repos/Err0r404/NintenDeals-API/commits');
    console.log("Last commit:", res.data[0].commit.author.date);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }
}
checkRepo();
