const axios = require('axios');
const sharp = require('sharp');

async function analyzePhotoAdvanced(url) {
    try {
        const res = await axios.get(url, { 
            responseType: 'arraybuffer', 
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://minkang.x.yupoo.com/' }
        });
        const img = sharp(Buffer.from(res.data));
        const meta = await img.metadata();
        const { width, height } = meta;
        const cs = 12;
        const positions = [[0, 0], [width - cs, 0], [0, height - cs], [width - cs, height - cs]];
        
        let corners = [];
        for (const [l, t] of positions) {
            const st = await img.clone().extract({ left: l, top: t, width: cs, height: cs }).stats();
            corners.push({ r: st.channels[0].mean, g: st.channels[1].mean, b: st.channels[2].mean });
        }
        
        // Verificar uniformidade (os 4 cantos devem ser parecidos)
        let maxDiffBetweenCorners = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
                const d = Math.sqrt(
                    Math.pow(corners[i].r - corners[j].r, 2) + 
                    Math.pow(corners[i].g - corners[j].g, 2) + 
                    Math.pow(corners[i].b - corners[j].b, 2)
                );
                if (d > maxDiffBetweenCorners) maxDiffBetweenCorners = d;
            }
        }
        
        // Também verificar se o centro é diferente do fundo (opcional, para evitar fotos de parede vazia)
        const cx = Math.max(0, Math.floor(width/2) - 25), cy = Math.max(0, Math.floor(height/2) - 25);
        const centerStats = await img.clone().extract({ left: cx, top: cy, width: 50, height: 50 }).stats();
        const centerR = centerStats.channels[0].mean;
        
        // Se maxDiffBetweenCorners < 40 e a variância interna de cada canto é baixa, é Full Shot.
        return { isFullShot: maxDiffBetweenCorners < 40, maxDiff: maxDiffBetweenCorners, centerR };
    } catch (e) {
        return { isFullShot: false, error: e.message };
    }
}

async function main() {
    const images = [
        "https://photo.yupoo.com/minkang/8880900b/0047ab61.jpg", // 1
        "https://photo.yupoo.com/minkang/0bbfef2a/d8043471.jpg", // 2
        "https://photo.yupoo.com/minkang/83f774a5/670d68a2.jpg", // 3
        "https://photo.yupoo.com/minkang/7cf91cbe/e281906e.jpg", // 4
        "https://photo.yupoo.com/minkang/7532a54a/3a3c273b.jpg", // 5
        "https://photo.yupoo.com/minkang/51e9b31e/f58dc070.jpg", // 6
        "https://photo.yupoo.com/minkang/616b631f/a21d1ddf.jpg"  // 7
    ];
    
    console.log('--- ADVANCED ANALYSIS (UNIFORM BACKGROUND) ---');
    for (let i = 0; i < images.length; i++) {
        const res = await analyzePhotoAdvanced(images[i]);
        console.log(`Image ${i+1}: ${res.isFullShot ? '✅ FULL' : '❌ DETAIL'} (Diff: ${res.maxDiff?.toFixed(1)})`);
    }
}

main();
