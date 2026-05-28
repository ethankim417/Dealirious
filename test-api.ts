import axios from 'axios';

async function test() {
  try {
    const { data } = await axios.get("http://127.0.0.1:3000/api/psplus/monthly");
    console.log(data);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
