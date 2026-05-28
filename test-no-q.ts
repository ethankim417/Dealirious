import axios from 'axios';

async function test() {
    try {
        const response = await axios.get(`http://localhost:3000/api/deals?cc=kr&page=2`);
        console.log("Deals size:", response.data.length);
        if(response.data.length > 0) {
            console.log("First deal:", response.data[0].name);
        }
    } catch (e: any) {
        console.error("Error:", e.response?.status);
    }
}
test();
