const axios = require('axios');
const fs = require('fs');

const albumUrl = 'https://minkang.x.yupoo.com/albums/228200958?uid=1&isSubCate=false&referrercate=680738';

async function testScrapeAlbum() {
    try {
        console.log(`Testando raspagem do álbum: ${albumUrl}`);
        const res = await axios.get(albumUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.yupoo.com/'
            }
        });
        
        fs.writeFileSync('album_debug.html', res.data);
        console.log('HTML salvo em album_debug.html para análise.');
        
        // Regex simples para achar fotos do yupoo no HTML
        const matches = res.data.match(/photo\.yupoo\.com\/[^\/]+\/[^\/]+\/[^"]+/g);
        if (matches) {
            const unique = [...new Set(matches)];
            console.log(`Encontradas ${unique.length} fotos únicas!`);
            unique.forEach((img, i) => console.log(`${i+1}: https://${img}`));
        } else {
            console.log('Nenhuma foto encontrada no HTML.');
        }

    } catch (err) {
        console.error('Erro:', err.message);
    }
}

testScrapeAlbum();
