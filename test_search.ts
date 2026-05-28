import axios from 'axios';

async function test() {
    try {
        const uid = Math.random().toString();
        const response = await axios.get(`http://localhost:3000/api/deals?q=${encodeURIComponent("witcher 2")}&cc=kr&v=${uid}`);
        console.log("Status:", response.status);
        console.log("Headers:", response.headers);
        console.log("Deals size:", response.data.length);
        console.log("Deals:", response.data.map((d: any) => d.name));
    } catch (e: any) {
        console.error("Error status:", e.response?.status);
        console.error("Error data:", e.response?.data);
    }
}
test();
