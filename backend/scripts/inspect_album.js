const axios = require('axios');

async function inspectAlbum(albumId) {
    const url = `https://minkang.x.yupoo.com/albums/${albumId}?uid=1`;
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        // Yupoo usually has image URLs in data-url or src
        const regex = /https:\/\/photo\.yupoo\.com\/[^\/]+\/[^\/]+\/[^"'\s<>]+(?:\.jpg|\.jpeg|\.png)/gi;
        const matches = html.match(regex) || [];
        const unique = [...new Set(matches.map(img => img.split('?')[0]))];
        console.log(`Album ${albumId} has ${unique.length} photos:`);
        unique.forEach((img, i) => console.log(`${i+1}: ${img}`));
    } catch (e) {
        console.error(e.message);
    }
}

inspectAlbum('212394440');
