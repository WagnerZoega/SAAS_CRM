const axios = require('axios');
const sharp = require('sharp');

async function analyzePhotoV5_3(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const img = sharp(Buffer.from(res.data));
        const { width, height } = await img.metadata();
        
        // 1. Uniformidade dos Cantos
        const cs = 12;
        const positions = [[0, 0], [width - cs, 0], [0, height - cs], [width - cs, height - cs]];
        let corners = [];
        for (const [l, t] of positions) {
            const st = await img.clone().extract({ left: l, top: t, width: cs, height: cs }).stats();
            corners.push({ r: st.channels[0].mean, g: st.channels[1].mean, b: st.channels[2].mean });
        }
        
        let cornerDiff = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
                const d = Math.sqrt(Math.pow(corners[i].r - corners[j].r, 2) + Math.pow(corners[i].g - corners[j].g, 2) + Math.pow(corners[i].b - corners[j].b, 2));
                if (d > cornerDiff) cornerDiff = d;
            }
        }

        // 2. Contraste Centro vs Cantos (A chave para evitar Zoom)
        const cx = Math.max(0, Math.floor(width/2) - 25), cy = Math.max(0, Math.floor(height/2) - 25);
        const centerStats = await img.clone().extract({ left: cx, top: cy, width: 50, height: 50 }).stats();
        const center = { r: centerStats.channels[0].mean, g: centerStats.channels[1].mean, b: centerStats.channels[2].mean };
        
        const avgCorner = {
            r: (corners[0].r + corners[1].r + corners[2].r + corners[3].r) / 4,
            g: (corners[0].g + corners[1].g + corners[2].g + corners[3].g) / 4,
            b: (corners[0].b + corners[1].b + corners[2].b + corners[3].b) / 4
        };
        
        const contrast = Math.sqrt(Math.pow(center.r - avgCorner.r, 2) + Math.pow(center.g - avgCorner.g, 2) + Math.pow(center.b - avgCorner.b, 2));

        return { 
            isFullShot: cornerDiff < 45 && contrast > 30, // Se contrast < 30, provavelmente é zoom no tecido
            cornerDiff, 
            contrast,
            url 
        };
    } catch { return null; }
}

async function testAlbum(albumUrl) {
    const res = await axios.get(albumUrl);
    const regex = /https:\/\/photo\.yupoo\.com\/[^\/]+\/[^\/]+\/[^"'\s<>]+(?:\.jpg|\.jpeg|\.png)/gi;
    const matches = [...new Set(res.data.match(regex))];
    console.log(`Analisando ${matches.length} fotos do álbum...`);
    
    for (const url of matches) {
        const info = await analyzePhotoV5_3(url);
        if (info) {
            console.log(`${info.isFullShot ? '✅' : '❌'} Contrast: ${info.contrast.toFixed(1)} | CornerDiff: ${info.cornerDiff.toFixed(1)} | URL: ${url}`);
        }
    }
}

testAlbum('https://minkang.x.yupoo.com/albums/212394440?uid=1');
