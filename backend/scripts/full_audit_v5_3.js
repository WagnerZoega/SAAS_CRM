const axios = require('axios');
const sharp = require('sharp');

async function getHTML(url) {
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        return res.data;
    } catch { return null; }
}

async function check(url) {
    try {
        const res = await axios.get(url, { 
            responseType: 'arraybuffer',
            headers: { 'Referer': 'https://minkang.x.yupoo.com/' }
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
        
        let cornerDiff = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
                const d = Math.sqrt(Math.pow(corners[i].r - corners[j].r, 2) + Math.pow(corners[i].g - corners[j].g, 2) + Math.pow(corners[i].b - corners[j].b, 2));
                if (d > cornerDiff) cornerDiff = d;
            }
        }

        return { contrast, cornerDiff, url };
    } catch (e) { return null; }
}

async function main() {
    const albumUrl = 'https://minkang.x.yupoo.com/albums/212394440?uid=1';
    const html = await getHTML(albumUrl);
    const regex = /https:\/\/photo\.yupoo\.com\/[^\/]+\/[^\/]+\/[^"'\s<>]+(?:\.jpg|\.jpeg|\.png)/gi;
    const matches = [...new Set(html.match(regex) || [])];
    
    console.log(`Analisando ${matches.length} fotos...`);
    for (const url of matches) {
        const res = await check(url);
        if (res) {
            const isFull = res.cornerDiff < 45 && res.contrast > 30; // NOVO LIMIAR V5.3
            console.log(`${isFull ? '✅' : '❌'} Cnt:${res.contrast.toFixed(1)} | Crn:${res.cornerDiff.toFixed(1)} | ${url}`);
        }
    }
}
main();
