const axios = require('axios');
const sharp = require('sharp');

async function inspectCorners(url) {
    try {
        const res = await axios.get(url, { 
            responseType: 'arraybuffer', 
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://minkang.x.yupoo.com/'
            }
        });
        const img = sharp(Buffer.from(res.data));
        const meta = await img.metadata();
        const { width, height } = meta;
        const cs = 12;
        const positions = [
            { pos: 'Top-Left', l: 0, t: 0 },
            { pos: 'Top-Right', l: width - cs, t: 0 },
            { pos: 'Bottom-Left', l: 0, t: height - cs },
            { pos: 'Bottom-Right', l: width - cs, t: height - cs }
        ];
        
        console.log(`Image: ${url} (${width}x${height})`);
        for (const p of positions) {
            const st = await img.clone().extract({ left: p.l, top: p.t, width: cs, height: cs }).stats();
            const r = st.channels[0].mean, g = st.channels[1].mean, b = st.channels[2].mean;
            console.log(`   ${p.pos}: R=${r.toFixed(1)}, G=${g.toFixed(1)}, B=${b.toFixed(1)} (Diff Max: ${Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(r-b)).toFixed(1)})`);
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

inspectCorners("https://photo.yupoo.com/minkang/8880900b/0047ab61.jpg");
