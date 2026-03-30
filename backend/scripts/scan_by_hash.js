const axios = require('axios');

async function findAlbumByHash(categoryUrl, hash) {
    try {
        const res = await axios.get(categoryUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        if (html.includes(hash)) {
            console.log(`Found hash ${hash} on ${categoryUrl}`);
            const regex = new RegExp(`href="([^"]+)"[^>]*>[^<]*${hash}`, 'i');
            // Actually, the hash is in the thumbnail URL
            const thumbRegex = new RegExp(`href="([^"]+)"[^>]*>\\s*<div[^>]*>\\s*<img[^>]*src="[^"]*${hash}`, 'i');
            const m = html.match(thumbRegex);
            if (m) console.log(`Album URL: https://minkang.x.yupoo.com${m[1]}`);
            return true;
        }
    } catch (e) {
        console.error(e.message);
    }
    return false;
}

(async () => {
    const hash = '8880900b';
    const categories = [
        'https://minkang.x.yupoo.com/categories/680748?isSubCate=true', // Retro
        'https://minkang.x.yupoo.com/categories/720314?isSubCate=true', // Flamengo
        'https://minkang.x.yupoo.com/categories/3856104?isSubCate=true' // Brazil Column
    ];
    for (const cat of categories) {
        if (await findAlbumByHash(cat, hash)) break;
    }
})();
