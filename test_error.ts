import axios from 'axios';
async function run() {
    try {
        const res = await axios.get('http://localhost:3000/api/deals?cc=us&platform=quest&page=1&lang=en&q=moss&v=5');
        console.log(res.data.length);
        console.log(res.data[0]);
    } catch (e: any) {
        console.error(e.response?.data);
    }
}
run();
