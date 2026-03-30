const axios = require('axios');
const sharp = require('sharp');

async function debugImage(url) {
    console.log(`Testing: ${url}`);
    try {
        const res = await axios.get(url, { 
            responseType: 'arraybuffer', 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://minkang.x.yupoo.com/'
            }
        });
        console.log(`   Success! Status: ${res.status}, Type: ${res.headers['content-type']}, Size: ${res.data.length} bytes`);
        const img = sharp(Buffer.from(res.data));
        const meta = await img.metadata();
        console.log(`   Sharp Metadata: ${meta.width}x${meta.height}, format: ${meta.format}`);
    } catch (e) {
        console.log(`   FAILED: ${e.message}`);
        if (e.response) console.log(`   Response Status: ${e.response.status}`);
    }
}

const images = [
    "https://photo.yupoo.com/minkang/8880900b/0047ab61.jpg",
    "https://photo.yupoo.com/minkang/0bbfef2a/d8043471.jpg"
];

(async () => {
    for (const img of images) await debugImage(img);
    process.exit(0);
})();
