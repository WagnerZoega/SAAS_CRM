const axios = require('axios');

const TERMOS_DETALHE = [
    'detail', 'detalhe', 'tag', 'label', 'logo', 'badge', 'close', 'zoom', 
    'sleeve', 'manga', 'collar', 'gola', 'inside', 'dentro', 'wash', 'lavagem',
    'patch', 'fabric', 'tecido', 'stitching', 'costura', 'name', 'number', 'size',
    'icon', 'logo@558.png'
];

async function getAlbumPhotosTest(albumUrl) {
    try {
        const res = await axios.get(albumUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.yupoo.com/'
            },
            timeout: 15000
        });
        const html = res.data;
        const regex = /https:\/\/photo\.yupoo\.com\/[^\/]+\/[^\/]+\/[^"'\s<>]+(?:\.jpg|\.jpeg|\.png)/gi;
        const matches = html.match(regex);
        if (!matches) return [];
        
        const uniquePhotos = [...new Set(matches.map(img => img.split('?')[0]))].filter(img => {
            const lower = img.toLowerCase();
            return !lower.includes('icon') && !lower.includes('logo') && !lower.includes('logo@558.png');
        });
        
        console.log(`Total de fotos encontradas: ${uniquePhotos.length}`);

        const cleanPhotos = uniquePhotos.filter(url => {
            const lowerUrl = url.toLowerCase();
            return !TERMOS_DETALHE.some(termo => lowerUrl.includes(termo));
        });

        console.log(`Fotos Limpas (Frente/Verso): ${cleanPhotos.length}`);
        
        const finalPhotos = cleanPhotos.length >= 2 ? cleanPhotos.slice(0, 2) : uniquePhotos.slice(0, 2);
        
        return {
            all: uniquePhotos,
            clean: cleanPhotos,
            final: finalPhotos
        };
    } catch (err) {
        console.error("ERRO NA REQUISIÇÃO:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
        }
        return null;
    }
}

async function test() {
    const albumUrl = 'https://minkang.x.yupoo.com/albums/229204927?uid=1&isSubCate=false&referrercate=711624';
    console.log(`Testando Álbum: ${albumUrl}`);
    const result = await getAlbumPhotosTest(albumUrl);
    if (result) {
        console.log('\n--- RESULTADO FINAL ---');
        console.log(result.final);
        console.log(`\nRegra aplicada: Pegou ${result.final.length} fotos.`);
    }
}

test();
