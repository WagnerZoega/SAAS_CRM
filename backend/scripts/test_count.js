const axios = require('axios');

async function testCount() {
    const url = 'https://minkang.x.yupoo.com/categories/720314?isSubCate=true';
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = res.data;
        const albumRegex = /\/albums\/(\d+)\?uid=1/g;
        const foundAlbums = html.match(albumRegex) || [];
        const uniqueAlbums = [...new Set(foundAlbums)];
        console.log(`URL: ${url}`);
        console.log(`Albums encontrados: ${uniqueAlbums.length}`);
    } catch (e) {
        console.error(e.message);
    }
}
testCount();
