const axios = require('axios');
const sharp = require('sharp');

async function check(url, label) {
    try {
        const res = await axios.get(url, { 
            responseType: 'arraybuffer',
            headers: {
                'Referer': 'https://minkang.x.yupoo.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const img = sharp(Buffer.from(res.data));
        const { width, height } = await img.metadata();
        
        const cs = 12;
        const positions = [[0, 0], [width - cs, 0], [0, height - cs], [width - cs, height - cs]];
        let corners = [];
        for (const [l, t] of positions) {
            const st = await img.clone().extract({ left: l, top: t, width: cs, height: cs }).stats();
            corners.push({ r: st.channels[0].mean, g: st.channels[1].mean, b: st.channels[2].mean });
        }
        
        const cx = Math.max(0, Math.floor(width/2) - 25), cy = Math.max(0, Math.floor(height/2) - 25);
        const centerStats = await img.clone().extract({ left: cx, top: cy, width: 50, height: 50 }).stats();
        const center = { r: centerStats.channels[0].mean, g: centerStats.channels[1].mean, b: centerStats.channels[2].mean };
        
        const avgCorner = {
            r: (corners[0].r + corners[1].r + corners[2].r + corners[3].r) / 4,
            g: (corners[0].g + corners[1].g + corners[2].g + corners[3].g) / 4,
            b: (corners[0].b + corners[1].b + corners[2].b + corners[3].b) / 4
        };
        
        const contrast = Math.sqrt(Math.pow(center.r - avgCorner.r, 2) + Math.pow(center.g - avgCorner.g, 2) + Math.pow(center.b - avgCorner.b, 2));

        console.log(`[${label}] Contrast: ${contrast.toFixed(1)} | URL: ${url}`);
    } catch (e) { console.log(`[${label}] Error: ${e.message}`); }
}

async function main() {
    // Foto de DETALHE (confirmada pelo subagent)
    await check('https://photo.yupoo.com/minkang/83f774a5/670d68a2.jpg', 'DETAIL');
    
    // Foto do FINAL do álbum (provável corpo inteiro)
    await check('https://photo.yupoo.com/minkang/848cf64e/7d14d232.jpg', 'POSSIBLE_FULL');
    await check('https://photo.yupoo.com/minkang/0bbfef2a/big.jpg', 'OLD_BIG_PHOTO');
}
main();
