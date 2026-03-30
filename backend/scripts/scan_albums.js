const axios = require('axios');

async function findAlbum() {
    const url = 'https://minkang.x.yupoo.com/categories/720314?isSubCate=true';
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = res.data;
        const regex = /href="([^"]+)"[^>]*title="([^"]*Flamengo[^"]*1994[^"]*)"/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
            console.log(`Found: ${match[2]} -> https://minkang.x.yupoo.com${match[1]}`);
        }
    } catch (e) {
        console.error(e.message);
    }
}

findAlbum();
