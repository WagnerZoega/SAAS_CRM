const axios = require('axios');
const sharp = require('sharp');

async function analyzePhotoDetail(url) {
    try {
        const res = await axios.get(url, { 
            responseType: 'arraybuffer', 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://minkang.x.yupoo.com/'
            }
        });
        const img = sharp(Buffer.from(res.data));
        const meta = await img.metadata();
        const { width, height } = meta;
        const cs = 12;
        const positions = [
            [0, 0], [Math.max(0, width - cs), 0],
            [0, Math.max(0, height - cs)], [Math.max(0, width - cs), Math.max(0, height - cs)]
        ];
        let neutralCorners = 0;
        for (const [left, top] of positions) {
            try {
                const st = await img.clone().extract({ left, top, width: cs, height: cs }).stats();
                const r = st.channels[0].mean, g = st.channels[1].mean, b = st.channels[2].mean;
                if (Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(r-b)) < 30 && r > 130) neutralCorners++;
            } catch {}
        }
        
        const cx = Math.max(0, Math.floor(width/2) - 25), cy = Math.max(0, Math.floor(height/2) - 25);
        let hash = 0;
        try {
            const cs2 = await img.clone().extract({ left: cx, top: cy, width: 50, height: 50 }).stats();
            hash = Math.round(cs2.channels[0].mean * 100 + cs2.channels[1].mean * 10 + cs2.channels[2].mean);
        } catch {}
        
        return { isFullShot: neutralCorners >= 3, neutralCorners, hash, width, height };
    } catch (e) {
        return { isFullShot: false, error: e.message };
    }
}

async function main() {
    const images = [
        "https://photo.yupoo.com/minkang/8880900b/0047ab61.jpg", // Pos 1
        "https://photo.yupoo.com/minkang/0bbfef2a/d8043471.jpg", // Pos 2
        "https://photo.yupoo.com/minkang/83f774a5/670d68a2.jpg", // Pos 3
        "https://photo.yupoo.com/minkang/7cf91cbe/e281906e.jpg", // Pos 4
        "https://photo.yupoo.com/minkang/7532a54a/3a3c273b.jpg", // Pos 5
        "https://photo.yupoo.com/minkang/51e9b31e/f58dc070.jpg", // Pos 6
        "https://photo.yupoo.com/minkang/616b631f/a21d1ddf.jpg"  // Pos 7
    ];
    
    console.log('--- FINAL ANALYSIS OF FLAMENGO 1994 PHOTOS ---');
    for (let i = 0; i < images.length; i++) {
        const res = await analyzePhotoDetail(images[i]);
        if (res.error) {
            console.log(`Image ${i+1}: ❌ ERROR: ${res.error}`);
        } else {
            console.log(`Image ${i+1}: ${res.isFullShot ? '✅ FULL' : '❌ DETAIL'} (Corners: ${res.neutralCorners}, Hash: ${res.hash})`);
        }
    }
    process.exit(0);
}

main();
