const axios = require('axios');

async function findAthletico() {
    const url = 'https://minkang.x.yupoo.com/categories/680738?isSubCate=true'; // Brasileirao
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        const regex = /href="\/categories\/(\d+)\?isSubCate=true"[^>]*title="([^"]*Athletico[^"]*)"/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
            console.log(`Found: ${match[2]} -> ID: ${match[1]}`);
        }
    } catch (e) {
        console.error(e.message);
    }
}

findAthletico();
